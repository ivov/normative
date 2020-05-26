module.exports = {
	rootDir: "../",
	testMatch: ["<rootDir>/tests/*.test.ts"],
	transform: {
		"^.+\\.ts$": "ts-jest"
	},
	testEnvironment: "node",
	coveragePathIgnorePatterns: ["<rootDir>/services/TerminalLogger.ts"],
	globals: {
		"ts-jest": {
			isolatedModules: true // speeds up ts-jest
		}
	},
	testEnvironment: "node",
	verbose: true,
	silent: true,
	maxWorkers: 1
};
