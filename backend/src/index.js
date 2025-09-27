const fs = require("fs")
const mkdirp = require("mkdirp")
const express = require("express")
const http = require("http")
const promclient = require("prom-client")
const process = require("process")

console.log(process.argv)
const port = process.argv[2] === "dev" ? 8082 : 8080

var app = express()
var server = http.createServer(app)
var io = require("socket.io").listen(server)
server.listen(port)
console.log("listening on port ", port)

app.use("/", express.static("build"))
app.get("/info", (req, res) => {
	res.send("Dell server monitor express server")
})

// Set up prometheus
app.get("/metrics", (req, res) => {
	res.send(promclient.register.metrics())
})
promclient.collectDefaultMetrics({
	labels: { application: "serverManager" },
})
const gauge = new promclient.Gauge({
	name: "servermanager_statistics_gauge",
	help: "Contains all gauge statistics from the dell server manager labeled by name and type, ex fan speed or temperature",
	labelNames: ["name", "type", "unit", "address", "host_name"],
})

const units = require("./units")
const { getSensors, enableManualFancontrol, enableAutomaticFancontrol, setFanSpeed } = require("./ipmi")
const {
	DEFAULT_BASELINE_FAN_CURVE,
	DEFAULT_REACTIVE_FAN_CURVE,
	buildFanCurveTable,
	normalizeFanCurve,
	getFanSpeedFromTable,
} = require("./fanCurve")
const { getAmbientTemperature, getMaxCpuTemperature, getFallbackTemperature } = require("./temperature")

const DEFAULT_ERROR_FAN_SPEED = 100

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value))
}

function getNumericFanSpeed(value, fallback = DEFAULT_ERROR_FAN_SPEED) {
	const numericValue = Number(value)
	if (!Number.isFinite(numericValue)) {
		return fallback
	}
	return clamp(Math.round(numericValue), 0, 100)
}
mkdirp.sync("./data")

let serversOnDisk = ""
let servers = []

function applyServerDefaults(server = {}) {
	if (typeof server.restoreFanControlOnExit !== "boolean") {
		server.restoreFanControlOnExit = true
	}
	const baselineCurve = normalizeFanCurve(server.fancurve, DEFAULT_BASELINE_FAN_CURVE)
	const reactiveCurve = normalizeFanCurve(server.reactiveFanCurve, DEFAULT_REACTIVE_FAN_CURVE)
	server.fancurve = [...baselineCurve]
	server.reactiveFanCurve = [...reactiveCurve]
	server.errorFanSpeed = getNumericFanSpeed(server.errorFanSpeed, DEFAULT_ERROR_FAN_SPEED)
	return server
}

try {
	let data = fs.readFileSync("./data/servers.json", "utf8")
	if (data) {
		serversOnDisk = data
		servers = JSON.parse(data).map(applyServerDefaults)
		console.log("Loaded server data from disk")
	}
} catch (e) {}
function save() {
	if (JSON.stringify(servers, null, 4) !== serversOnDisk) {
		serversOnDisk = JSON.stringify(servers, null, 4)
		fs.writeFileSync(
			"./data/servers.json",
			JSON.stringify(
				servers.map(({ restoreFanControlOnExit, ...rest }) => ({
					...rest,
					restoreFanControlOnExit,
				})),
				null,
				4
			)
		)
		// console.log(Date.now() + "Saved servers")
	}
}
setInterval(save, 60 * 1000) // Autosave once a minute if there are changes
const clients = [
	//     {
	//     id: 1234,
	//     tagListeners: [{tagname: "testTag"}],
	//     socket: {},
	// }
]
if (!servers.length) {
	servers = [
		{
			name: "R720 main",
			address: "192.168.10.170",
			username: "root",
			password: "calvin",
			warnspeed: "3000",
			sensordataRaw: [],
			sensordata: [],
			fancurve: [...DEFAULT_BASELINE_FAN_CURVE],
			reactiveFanCurve: [...DEFAULT_REACTIVE_FAN_CURVE],
			errorFanSpeed: DEFAULT_ERROR_FAN_SPEED,
		},
		{
			name: "R720 secondary",
			address: "192.168.10.169",
			username: "root",
			password: "calvin",
			warnspeed: "3000",
			sensordataRaw: [],
			sensordata: [],
			fancurve: [...DEFAULT_BASELINE_FAN_CURVE],
			reactiveFanCurve: [...DEFAULT_REACTIVE_FAN_CURVE],
			errorFanSpeed: DEFAULT_ERROR_FAN_SPEED,
		},
	].map(applyServerDefaults)
}

// Startup tasks
servers.forEach(async (server) => {
	if (server.manualFanControl) {
		await enableManualFancontrol(server)
	} else {
		await enableAutomaticFancontrol(server)
	}
})

let isShuttingDown = false

async function restoreAutomaticFanControlOnAllServers() {
	const serversToRestore = servers.filter((server) => server.restoreFanControlOnExit !== false)
	if (!serversToRestore.length) {
		console.log("All servers opted out of restoring automatic fan control on shutdown")
		return
	}
	console.log("Restoring automatic fan control on registered servers before shutdown")
	await Promise.all(
		serversToRestore.map(async (server) => {
			try {
				await enableAutomaticFancontrol(server)
			} catch (error) {
				console.error(
					`Failed to restore automatic fan control for ${server.name || server.address}:`,
					error
				)
			}
		})
	)
}

async function gracefulShutdown({ code = 0, reason } = {}) {
	if (isShuttingDown) return
	isShuttingDown = true
	if (reason) {
		console.log(`Received ${reason}, shutting down gracefully`)
	}
	try {
		await restoreAutomaticFanControlOnAllServers()
	} catch (error) {
		console.error("Error while restoring automatic fan control during shutdown:", error)
	} finally {
		process.exit(code)
	}
}

process.on("SIGINT", () => gracefulShutdown({ code: 0, reason: "SIGINT" }))
process.on("SIGTERM", () => gracefulShutdown({ code: 0, reason: "SIGTERM" }))
process.on("uncaughtException", (error) => {
	console.error("Uncaught exception:", error)
	gracefulShutdown({ code: 1, reason: "uncaughtException" })
})
process.on("unhandledRejection", (error) => {
	console.error("Unhandled promise rejection:", error)
	gracefulShutdown({ code: 1, reason: "unhandledRejection" })
})

async function updateServers() {
	for (let i in servers) {
		let config = servers[i]
		config.sensordataRaw = await getSensors(config)
		// Transform sensor data into easier to use format
		config.sensordata = config.sensordataRaw.map((sensor, i) => {
			return {
				name: sensor[0],
				value: sensor[1],
				unit: sensor[2],
				status: sensor[3],
				x: sensor[4],
				ALL: sensor[5],
				WL: sensor[6],
				WH: sensor[7],
				AHH: sensor[8],
				y: sensor[9],
				trend: Number(sensor[1]) - Number(config.sensordata[i]?.previousValue) || undefined,
				previousValue: config.sensordata[i]?.value,
			}
		})
		broadcast("sensordata", {
			name: config.name,
			sensordata: config.sensordata,
		})
		if (config.manualFanControl) {
			const ambientTemperature = getAmbientTemperature(config.sensordata)
			const cpuTemperature = getMaxCpuTemperature(config.sensordata)

			const fallbackTemperature = getFallbackTemperature(config.sensordata)
			
			const baselineTable = buildFanCurveTable(config.fancurve)
			const reactiveTable = buildFanCurveTable(config.reactiveFanCurve)
			
			let baselineFanSpeed = getFanSpeedFromTable(baselineTable, ambientTemperature)
			if (baselineFanSpeed === undefined) {
				baselineFanSpeed = getFanSpeedFromTable(baselineTable, fallbackTemperature)
			}
			let reactiveFanSpeed = getFanSpeedFromTable(reactiveTable, cpuTemperature)
			if (reactiveFanSpeed === undefined) {
				reactiveFanSpeed = getFanSpeedFromTable(reactiveTable, fallbackTemperature)
			}
			const computedSpeeds = [baselineFanSpeed, reactiveFanSpeed].filter((value) => Number.isFinite(value))
			let targetFanSpeed = computedSpeeds.length ? Math.max(...computedSpeeds) : undefined
			if (!Number.isFinite(targetFanSpeed)) {
				targetFanSpeed = getNumericFanSpeed(config.errorFanSpeed)
			}
			
			targetFanSpeed = clamp(Number.isFinite(targetFanSpeed) ? targetFanSpeed : DEFAULT_ERROR_FAN_SPEED, 0, 100)
			console.log(
				"Ambient temp:",
				ambientTemperature,
				"CPU temp:",
				cpuTemperature,
				"Baseline speed:",
				baselineFanSpeed,
				"Reactive speed:",
				reactiveFanSpeed,
				"Setting fan speed",
				targetFanSpeed,
				"%"
			)
			setFanSpeed(config, targetFanSpeed || 40)
		}
	}
	// Report metrics to prometheus
	promclient.register.resetMetrics()
	for (let config of servers) {
		config.sensordata
			.filter((x) => !Number.isNaN(Number(x.value)))
			.forEach((sensor) => {
				gauge.set(
					{
						name: sensor.name,
						type: units.unit_to_type[sensor.unit],
						unit: sensor.unit,
						address: config.address,
						host_name: config.name,
					},
					Number(sensor.value)
				)
			})
	}
}
function broadcast(channel, data) {
	clients.forEach((client) => client.socket.emit(channel, data))
}

async function updateServerLoop() {
	let lastUpdateStart = Date.now()
	console.time("updateServers")
	await updateServers()
	console.timeEnd("updateServers")
	setTimeout(updateServerLoop, lastUpdateStart - Date.now() + 30000)
}
updateServerLoop()

io.on("connection", (socket) => {
	socket.on("registerWebclient", ({ id }) => {
		console.log("client is subscribing to timer with interval ")
		let client = {
			socket,
			id,
			tagListeners: [],
			screenListeners: [],
		}
		clients.push(client)
		socket.emit("servers", servers)
		socket.on("updateServer", async ({ address, update }) => {
			console.log("Updating server", address, cleanSensitive(update))
			let server = servers.find((x) => x.address === address)

			// If we toggled the manualFanControl option, run IPMI to toggle fan control mode
			if (server.manualFanControl !== update.manualFanControl) {
				console.time("Changed fan control state")
			if (update.manualFanControl) {
				await enableManualFancontrol(update)
			} else {
				await enableAutomaticFancontrol(update)
			}
				console.timeEnd("Changed fan control state")
			}

			for (let key of Object.keys(update)) {
				server[key] = update[key]
			}
			applyServerDefaults(server)
			broadcast("servers", servers)

			// Reset prometheus gauges in case some of the label names were changed
			promclient.register.resetMetrics()
		})
		socket.on("addServer", ({ server }) => {
			if (
				server &&
				!servers.find((x) => x.address == server.address) &&
				!servers.find((x) => x.name == server.name) &&
				server.name &&
				server.address &&
				server.username &&
				server.password
			) {
				servers.push(applyServerDefaults(server))
				broadcast("servers", servers)
			}
		})
		socket.on("deleteServer", ({ address }) => {
			servers = servers.filter((x) => x.address !== address)
			broadcast("servers", servers)
		})
		// socket.on("tagListen", ({ tagname, interval }) => {
		// 	console.log("Adding listener for", tagname)
		// 	client.tagListeners.push({ tagname })
		// 	let tag = getTag(tagname)
		// 	if (tag) socket.emit("tagValue", [tag])
		// })

		// setInterval(() => {
		//     socket.emit('debug', new Date());
		//     //   socket.emit("tagValue", tags)
		// }, 1000);
	})
})
function cleanSensitive(object) {
	let clean = { ...object }
	if (clean.password) clean.password = "hidden"
	return clean
}
