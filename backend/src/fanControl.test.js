const { chooseTargetFanSpeed } = require("./fanControl")

describe("chooseTargetFanSpeed", () => {
	const defaults = {
		errorFanSpeed: 85,
		defaultErrorFanSpeed: 100,
	}

	test("returns the max of baseline and reactive fan speeds", () => {
		const result = chooseTargetFanSpeed({
			baselineFanSpeed: 40,
			reactiveFanSpeed: 55,
			...defaults,
		})
		expect(result).toBe(55)
	})

	test("ignores non-finite computed fan speeds before taking max", () => {
		const result = chooseTargetFanSpeed({
			baselineFanSpeed: NaN,
			reactiveFanSpeed: 33,
			...defaults,
		})
		expect(result).toBe(33)
	})

	test("uses the provided error fan speed when both computed speeds are invalid", () => {
		const result = chooseTargetFanSpeed({
			baselineFanSpeed: undefined,
			reactiveFanSpeed: null,
			errorFanSpeed: 73,
			defaultErrorFanSpeed: 91,
		})
		expect(result).toBe(73)
	})

	test("falls back to default error fan speed when provided error speed is invalid", () => {
		const result = chooseTargetFanSpeed({
			baselineFanSpeed: undefined,
			reactiveFanSpeed: undefined,
			errorFanSpeed: "invalid",
			defaultErrorFanSpeed: 64,
		})
		expect(result).toBe(64)
	})

	test("clamps the returned fan speed between 0 and 100", () => {
		const result = chooseTargetFanSpeed({
			baselineFanSpeed: 150,
			reactiveFanSpeed: -42,
			errorFanSpeed: 120,
			defaultErrorFanSpeed: 10,
		})
		expect(result).toBe(100)
	})
})

