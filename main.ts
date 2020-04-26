import WordToJsonConverter from "./db/WordToJsonConverter";
import TerminalLogger from "./logging/TerminalLogger";
import FirestoreManager from "./db/FirestoreManager";
import JsonManager from "./db/JsonManager";

const main = async () => {
	try {
		const myConverter = new WordToJsonConverter("English");
		await myConverter.convertDocxToHtml();
		myConverter.convertHtmltoJson();
	} catch (error) {
		TerminalLogger.logError(error);
	}

	// const myLogger = new TerminalLogger();
	// myLogger.logEntryToTerminal("English", "agreement");
};

main();
