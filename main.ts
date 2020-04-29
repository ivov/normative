import WordToJsonConverter from "./db/WordToJsonConverter";
import dbLogger from "./db/DbLogger";
import FirestoreManager from "./db/FirestoreManager";
import JsonHelper from "./db/JsonHelper";
import MongoManager from "./db/MongoManager";

const main = async () => {
	try {
		// const myConverter = new WordToJsonConverter("English");
		// await myConverter.convertDocxToHtml();
		// myConverter.convertHtmltoJson();
		const mongoManager = new MongoManager("English");
		await mongoManager.init();
		// mongoManager.getDocument("English");
		const x = await mongoManager.getSummaryDocument();
		console.log(x.summary);
	} catch (error) {
		// dbLogger.fullRed(error);
		console.log(error);
	}

	// const myLogger = new TerminalLogger();
	// myLogger.logEntryToTerminal("English", "agreement");
};

main();
