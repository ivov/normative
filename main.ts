import CLI from "./utils/CLI";
import Logger from "./logs/Logger";
import FirestoreDB from "./db/FirestoreDB";
import MongoDB from "./db/MongoDB";

const main = async () => {
	const db = new FirestoreDB("English");
	// db.init();
	// const res = await db.getEntry("agreement");
	// console.log(res);
	// db.deleteAll();

	// const db = new MongoDB("English");
	// await db.init();
	// const res = await db.getAll();
	// console.log(res);

	const cli = new CLI();
	await cli.init().catch(error => {
		const myLogger = new Logger(cli.args.language);
		myLogger.highlight(error, "red");
	});
};

main();
