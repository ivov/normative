module.exports = {
	testMatch: ["<rootDir>/tests/*.test.ts"],
	transform: {
		"^.+\\.ts$": "ts-jest"
	},
	// collectCoverage: true,
	// collectCoverageFrom: ["db/**/*.ts"],
	testEnvironment: "node",
	globals: {
		"ts-jest": {
			isolatedModules: true // speeds up ts-jest
		}
	}
};
