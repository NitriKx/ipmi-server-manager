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

function calculateFanCurvePoint(curve, index, segmentSize) {
	if (!Number.isFinite(segmentSize) || segmentSize <= 0) {
		return null
	}
	const lowerIndex = Math.max(0, Math.floor(index / segmentSize))
	const upperIndex = Math.min(curve.length - 1, Math.ceil((index + 0.1) / segmentSize))
	const lowerValue = Number(curve[lowerIndex]) || 0
	const upperValue = Number(curve[upperIndex]) || 0
	const diff = upperValue - lowerValue
	const perC = diff / segmentSize
	const interpolationRatio = index / segmentSize - lowerIndex
	const rawSpeed = lowerValue + perC * interpolationRatio
	return {
		lowerIndex,
		upperIndex,
		lowerValue,
		upperValue,
		interpolationRatio,
		rawSpeed,
	}
}

function buildFanCurveTable(curve) {
	if (!Array.isArray(curve) || curve.length < 2) {
		return null
	}
	const segmentSize = 100 / (curve.length - 1)
	return new Array(100).fill(0).map((_, i) => {
		const point = calculateFanCurvePoint(curve, i, segmentSize)
		return point ? point.rawSpeed : undefined
	})
}

function getFanSpeedLookupDetails(curve, temperature) {
	if (!Array.isArray(curve) || curve.length < 2) {
		return undefined
	}
	const segmentSize = 100 / (curve.length - 1)
	if (!Number.isFinite(segmentSize) || segmentSize <= 0) {
		return undefined
	}
	const numericTemperature = Number(temperature)
	const temperatureWasFinite = Number.isFinite(numericTemperature)
	const appliedTemperature = clamp(
		temperatureWasFinite ? Math.floor(numericTemperature) : 99,
		0,
		99
	)
	const point = calculateFanCurvePoint(curve, appliedTemperature, segmentSize)
	if (!point || !Number.isFinite(point.rawSpeed)) {
		return {
			speed: undefined,
			rawSpeed: point ? point.rawSpeed : undefined,
			inputTemperature: numericTemperature,
			appliedTemperature,
			temperatureWasFinite,
			lowerIndex: point ? point.lowerIndex : undefined,
			upperIndex: point ? point.upperIndex : undefined,
			lowerValue: point ? point.lowerValue : undefined,
			upperValue: point ? point.upperValue : undefined,
			interpolationRatio: point ? point.interpolationRatio : undefined,
			segmentSize,
			curveLength: curve.length,
		}
	}
	return {
		speed: Math.round(point.rawSpeed),
		rawSpeed: point.rawSpeed,
		inputTemperature: numericTemperature,
		appliedTemperature,
		temperatureWasFinite,
		lowerIndex: point.lowerIndex,
		upperIndex: point.upperIndex,
		lowerValue: point.lowerValue,
		upperValue: point.upperValue,
		interpolationRatio: point.interpolationRatio,
		segmentSize,
		curveLength: curve.length,
	}
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
	getFanSpeedLookupDetails,
}

