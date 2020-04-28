module.exports = {
	testMatch: ["<rootDir>/tests/*.test.ts"],
	transform: {
		"^.+\\.ts$": "ts-jest"
	},
	testEnvironment: "node",
	globals: {
		"ts-jest": {
			isolatedModules: true // speeds up ts-jest
		}
	}
};
