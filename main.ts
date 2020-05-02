import WordToJsonConverter from "./db/WordToJsonConverter";
import dbLogger from "./db/DbLogger";
import FirestoreManager from "./db/FirestoreManager";
import JsonHelper from "./db/JsonHelper";
import MongoManager from "./db/MongoManager";

const main = async () => {
	try {
		const myConverter = new WordToJsonConverter("English");
		await myConverter.convertDocxToHtml();
		myConverter.convertHtmltoJson({ oneJsonFile: true });
		// const mongoManager = new MongoManager("English");
		// await mongoManager.init();
		// await mongoManager.uploadJsonEntry("agreement.json");
		// const x = await mongoManager.getSummaryDocument();
		// console.log(x.summary);
	} catch (error) {
		const myLogger = new dbLogger("English");
		myLogger.fullRed(error);
		// console.log(error);
	}

	// const myLogger = new TerminalLogger();
	// myLogger.logEntryToTerminal("English", "agreement");
};

main();
