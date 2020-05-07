import CliUtility from "./data/CliUtility";
import DataLogger from "./data/DataLogger";

const main = async () => {
	const cli = new CliUtility();
	await cli.init().catch(error => {
		const myLogger = new DataLogger(cli.args.language);
		myLogger.fullRed(error);
	});
};

main();
