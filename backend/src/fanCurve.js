const DEFAULT_BASELINE_FAN_CURVE = [8, 8, 8, 8, 8, 8, 15, 25, 30, 35,   40, 45, 50, 60, 70, 80, 90, 100, 100, 100, 100]
const DEFAULT_REACTIVE_FAN_CURVE = [8, 8, 8, 8, 8, 8, 8,  8,  10, 14,   18, 25, 35, 47, 60, 80, 90, 100, 100, 100, 100]

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value))
}

function normalizeFanCurve(curve, fallback = DEFAULT_BASELINE_FAN_CURVE) {
	if (!Array.isArray(fallback) || fallback.length < 2) {
		throw new Error("Fallback fan curve must contain at least two points")
	}
	if (!Array.isArray(curve)) {
		return [...fallback]
	}
	const normalized = curve
		.map((value) => {
			const numeric = Number(value)
			if (!Number.isFinite(numeric)) {
				return undefined
			}
			return clamp(numeric, 0, 100)
		})
		.filter((value) => value !== undefined)
	if (normalized.length < 2) {
		return [...fallback]
	}
	return normalized
}

function buildFanCurveTable(curve) {
	if (!Array.isArray(curve) || curve.length < 2) {
		return null
	}
	const segmentSize = 100 / (curve.length - 1)
	return new Array(100).fill(0).map((_, i) => {
		const lowerIndex = Math.max(0, Math.floor(i / segmentSize))
		const upperIndex = Math.min(curve.length - 1, Math.ceil((i + 0.1) / segmentSize))
		const lowerValue = Number(curve[lowerIndex]) || 0
		const upperValue = Number(curve[upperIndex]) || 0
		const diff = upperValue - lowerValue
		const perC = diff / segmentSize
		return lowerValue + perC * (i / segmentSize - lowerIndex) * 20
	})
}

function getFanSpeedFromTable(table, temperature) {
	if (!Array.isArray(table) || table.length === 0) {
		return undefined
	}
	const numericTemperature = Number(temperature)
	const index = Number.isFinite(numericTemperature) ? clamp(Math.floor(numericTemperature), 0, 99) : 99
	const speed = table[index]
	return Number.isFinite(speed) ? Math.round(speed) : undefined
}

module.exports = {
	DEFAULT_BASELINE_FAN_CURVE,
	DEFAULT_REACTIVE_FAN_CURVE,
	buildFanCurveTable,
	normalizeFanCurve,
	getFanSpeedFromTable,
}

