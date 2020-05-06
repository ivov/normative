import WordToJsonConverter from "./data/WordToJsonConverter";
import dataLogger from "./data/DataLogger";
import FirestoreManager from "./data/FirestoreManager";
import JsonHelper from "./data/JsonHelper";
import MongoManager from "./data/MongoManager";

const main = async () => {
	try {
		const myConverter = new WordToJsonConverter("English");
		await myConverter.convertDocxToHtml();
		myConverter.convertHtmlToJson({ multipleJsonFiles: true });
		// const mongoManager = new MongoManager("English");
		// await mongoManager.init();
		// await mongoManager.uploadAll({ fromSingleFile: true });
		// await mongoManager.deleteAllDocuments();
		// mongoManager.deleteDocument("agreement");
		// await mongoManager.uploadJsonEntry("agreement.json");
		// const x = await mongoManager.getSummaryDocument();
		// console.log(x.summary);
	} catch (error) {
		// const myLogger = new dataLogger("English");
		// myLogger.fullRed(error);
		console.log(error);
	}

	// const myLogger = new TerminalLogger();
	// myLogger.logEntryToTerminal("English", "agreement");
};

main();
