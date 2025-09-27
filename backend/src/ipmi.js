var exec = require("child_process").exec

function logCommandResult(label, error, out, err) {
	const hasStdout = typeof out === "string" && out.trim().length > 0
	const hasStderr = typeof err === "string" && err.trim().length > 0
	if (error) {
		if (hasStdout) {
			console.warn(`${label} command reported an error`, error)
			// console.warn(`${label} stdout:\n` + out)
		} else {
			console.error(`${label} command failed`, error)
		}
		if (hasStderr) {
			console.error(`${label} stderr:\n` + err)
		}
	}
}

function parseSensorOutput(out) {
	return (out || "")
		.split("\n")
		.map((x) => x.split("|").map((y) => y.trim()))
		.filter((x) => x[0] && x[1] !== "na")
}

function getSensors(config) {
	return new Promise((resolve) => {
		let command = `ipmitool -I lanplus -H ${config.address} -U ${config.username} -P '${config.password}' sensor`
		exec(command, (error, out, err) => {
			logCommandResult("getSensors", error, out, err)
			let data = parseSensorOutput(out)
			// console.log(data)
			resolve(data)
		})
	})
}
function enableManualFancontrol(config) {
	return new Promise((resolve) => {
		let command = `ipmitool -I lanplus -H ${config.address} -U ${config.username} -P '${config.password}' raw 0x30 0x30 0x01 0x00`
		exec(command, (error, out, err) => {
			logCommandResult("enableManualFancontrol", error, out, err)
			resolve(out)
		})
	})
}
function enableAutomaticFancontrol(config) {
	return new Promise((resolve) => {
		let command = `ipmitool -I lanplus -H ${config.address} -U ${config.username} -P '${config.password}' raw 0x30 0x30 0x01 0x01`
		exec(command, (error, out, err) => {
			logCommandResult("enableAutomaticFancontrol", error, out, err)
			resolve(out)
		})
	})
}
function setFanSpeed(config, speed) {
	return new Promise((resolve) => {
		if (process.argv[2] !== "dev") {
			var command = `ipmitool -I lanplus -H ${config.address} -U ${config.username} -P '${config.password}' raw 0x30 0x30 0x02 0xff 0x${speed.toString(16).padStart(2, "0")}`
		} else {
			var command = "ls"
		}
		exec(command, (error, out, err) => {
			logCommandResult("setFanSpeed", error, out, err)
			resolve(out)
		})
	})
}

module.exports = {
	getSensors,
	enableManualFancontrol,
	enableAutomaticFancontrol,
	setFanSpeed,
	parseSensorOutput,
}
