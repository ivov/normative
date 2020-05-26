// WORK IN PROGRESS

import CLI from "./services/CLI";
import TerminalLogger from "./services/TerminalLogger";
import FirestoreDB from "./db/FirestoreDB";
import MongoDB from "./db/MongoDB";

const main = async () => {
	const db = new MongoDB("English");
	await db.init();
	const entry = await db.getEntry("agreement");
	console.log(entry);
};

// const main = async () => {
// 	const cli = new CLI();
// 	await cli.init().catch(error => {
// 		TerminalLogger.failure(error);
// 	});
// };

main();
