import WordToJsonConverter from "./db/WordToJsonConverter";
import dbLogger from "./db/dbLogger";
import FirestoreManager from "./db/FirestoreManager";
import JsonManager from "./db/JsonManager";
import MongoManager from "./db/MongoManager";

const main = async () => {
	try {
		const myConverter = new WordToJsonConverter("English");
		await myConverter.convertDocxToHtml();
		myConverter.convertHtmltoJson();
		// const mongoManager = new MongoManager("English");
		// await mongoManager.init();
		// mongoManager.getDocument("English");
		// await mongoManager.uploadJson("English", "appraisal.json");
	} catch (error) {
		// dbLogger.logError(error);
		console.log(error);
	}

	// const myLogger = new TerminalLogger();
	// myLogger.logEntryToTerminal("English", "agreement");
};

main();
