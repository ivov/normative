module.exports = {
	testMatch: ["<rootDir>/tests/*.test.ts"],
	transform: {
		"^.+\\.ts$": "ts-jest"
	},
	testEnvironment: "node",
	coveragePathIgnorePatterns: ["<rootDir>/logs/Logger.ts"],
	globals: {
		"ts-jest": {
			isolatedModules: true // speeds up ts-jest
		}
	}
};
