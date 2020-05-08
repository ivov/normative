import Cli from "./utils/cli";
import Logger from "./logs/Logger";

const main = async () => {
	const cli = new Cli();
	await cli.init().catch(error => {
		const myLogger = new Logger(cli.args.language);
		myLogger.fullRed(error);
	});
};

main();
