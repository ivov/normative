import CLI from "./utils/CLI";
import Logger from "./logs/Logger";
import FirestoreDB from "./db/FirestoreDB";

const main = async () => {
	const db = new FirestoreDB("English");
	db.init();
	// db.uploadAll({ fromSingleJsonFile: true });
	// const res = await db.getEntry("agreement");
	const res = await db.getSummary();
	console.log(res);
	// db.deleteAll();

	// const cli = new CLI();
	// await cli.init().catch(error => {
	// 	const myLogger = new Logger(cli.args.language);
	// 	myLogger.fullRed(error);
	// });
};

main();
