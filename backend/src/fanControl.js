function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value))
}

function chooseTargetFanSpeed({
	baselineFanSpeed,
	reactiveFanSpeed,
	errorFanSpeed,
	defaultErrorFanSpeed = 100,
}) {
	const computedSpeeds = [baselineFanSpeed, reactiveFanSpeed].filter((value) =>
		Number.isFinite(value)
	)
	if (computedSpeeds.length) {
		return clamp(Math.max(...computedSpeeds), 0, 100)
	}
	const fallback = Number.isFinite(errorFanSpeed)
		? errorFanSpeed
		: defaultErrorFanSpeed
	return clamp(fallback, 0, 100)
}

module.exports = {
	chooseTargetFanSpeed,
}

