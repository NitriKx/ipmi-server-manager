function getNumericSensorValue(sensor) {
	const numericValue = Number(sensor?.value)
	return Number.isFinite(numericValue) ? numericValue : undefined
}

function getAmbientTemperature(sensors) {
	if (!Array.isArray(sensors)) {
		return undefined
	}
	const inletSensor = sensors.find((sensor) => {
		const name = sensor?.name
		return sensor?.unit === "degrees C" && typeof name === "string" && name.toLowerCase().includes("inlet")
	})
	return getNumericSensorValue(inletSensor)
}

function getMaxCpuTemperature(sensors) {
	if (!Array.isArray(sensors)) {
		return undefined
	}
	const cpuSensors = sensors.filter((sensor) => {
		const name = sensor?.name
		return sensor?.unit === "degrees C" && typeof name === "string" && name === "Temp"
	})
	const cpuTemperatures = cpuSensors
		.map(getNumericSensorValue)
		.filter((value) => value !== undefined)
	if (cpuTemperatures.length) {
		return Math.max(...cpuTemperatures)
	}
	return undefined
}

function getFallbackTemperature(sensors) {
	if (!Array.isArray(sensors)) {
		return undefined
	}
	const temperatures = sensors
		.filter((sensor) => sensor?.unit === "degrees C")
		.map(getNumericSensorValue)
		.filter((value) => value !== undefined)
	if (temperatures.length) {
		return Math.max(...temperatures)
	}
	return undefined
}

module.exports = {
	getAmbientTemperature,
	getMaxCpuTemperature,
	getFallbackTemperature,
}

