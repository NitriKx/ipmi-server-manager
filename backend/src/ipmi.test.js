const { parseSensorOutput } = require("./ipmi")

const sampleOutput = [
	"SEL              | na         | discrete   | na    | na        | na        | na        | na        | na        | na        ",
	"Intrusion        | 0x0        | discrete   | 0x0080| na        | na        | na        | na        | na        | na        ",
	"Fan1 RPM         | 8880,000   | RPM        | ok    | na        | 360,000   | 600,000   | na        | na        | na        ",
	"Fan2 RPM         | 8880,000   | RPM        | ok    | na        | 360,000   | 600,000   | na        | na        | na        ",
	"Fan3 RPM         | 8880,000   | RPM        | ok    | na        | 360,000   | 600,000   | na        | na        | na        ",
	"Fan4 RPM         | 8880,000   | RPM        | ok    | na        | 360,000   | 600,000   | na        | na        | na        ",
	"Fan5 RPM         | 9000,000   | RPM        | ok    | na        | 360,000   | 600,000   | na        | na        | na        ",
	"Fan6 RPM         | 8880,000   | RPM        | ok    | na        | 360,000   | 600,000   | na        | na        | na        ",
	"Inlet Temp       | 23,000     | degrees C  | ok    | na        | -7,000    | 3,000     | 42,000    | 47,000    | na        ",
	"CPU Usage        | 4,000      | percent    | ok    | na        | na        | na        | 101,000   | na        | na        ",
	"IO Usage         | 0,000      | percent    | ok    | na        | na        | na        | 101,000   | na        | na        ",
	"MEM Usage        | 0,000      | percent    | ok    | na        | na        | na        | 101,000   | na        | na        ",
	"SYS Usage        | 5,000      | percent    | ok    | na        | na        | na        | 101,000   | na        | na        ",
	"Exhaust Temp     | 31,000     | degrees C  | ok    | na        | 0,000     | 0,000     | 70,000    | 75,000    | na        ",
	"Temp             | 33,000     | degrees C  | ok    | na        | 3,000     | 8,000     | 87,000    | 92,000    | na        ",
	"Temp             | 35,000     | degrees C  | ok    | na        | 3,000     | 8,000     | 87,000    | 92,000    | na        ",
	"OS Watchdog      | 0x0        | discrete   | 0x0080| na        | na        | na        | na        | na        | na        ",
	"Status           | na         | discrete   | na    | na        | na        | na        | na        | na        | na        ",
	"PS Redundancy    | na         | discrete   | na    | na        | na        | na        | na        | na        | na        ",
	"Pwr Consumption  | 182,000    | Watts      | ok    | na        | na        | na        | 1260,000  | 1386,000  | na        ",
].join("\n")

describe("parseSensorOutput", () => {
	test("filters out rows without sensor values", () => {
		const sensors = parseSensorOutput(sampleOutput)
		const sensorNames = sensors.map((row) => row[0])
		expect(sensorNames).toContain("Intrusion")
		expect(sensorNames).toContain("Fan1 RPM")
		expect(sensorNames).toContain("Pwr Consumption")
		expect(sensorNames).not.toContain("SEL")
		expect(sensorNames).not.toContain("PS Redundancy")
	})

	test("trims columns and preserves sensor data", () => {
		const sensors = parseSensorOutput(sampleOutput)
		const fan1 = sensors.find((row) => row[0] === "Fan1 RPM")
		expect(fan1).toEqual([
			"Fan1 RPM",
			"8880,000",
			"RPM",
			"ok",
			"na",
			"360,000",
			"600,000",
			"na",
			"na",
			"na",
		])
	})

	test("returns empty array for empty output", () => {
		expect(parseSensorOutput("")).toEqual([])
		expect(parseSensorOutput(null)).toEqual([])
	})
})

