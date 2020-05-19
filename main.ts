// WORK IN PROGRESS

import CLI from "./utils/CLI";
import Logger from "./logs/Logger";

const main = async () => {
	const cli = new CLI();
	await cli.init().catch(error => {
		const myLogger = new Logger(cli.args.language);
		myLogger.highlight(error, "red");
	});
};

main();
