// WORK IN PROGRESS

import CLI from "./services/CLI";
import TerminalLogger from "./services/TerminalLogger";

const main = async () => {
	const cli = new CLI();
	await cli.init().catch(error => {
		TerminalLogger.failure(error);
	});
};

main();
