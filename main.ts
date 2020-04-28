import WordToJsonConverter from "./db/WordToJsonConverter";
import TerminalLogger from "./logging/TerminalLogger";
import FirestoreManager from "./db/FirestoreManager";
import JsonManager from "./db/JsonManager";
import dotenv from "dotenv";

const main = async () => {
	try {
		const myConverter = new WordToJsonConverter(
			"English"
			// "db/docx/testing/eng_mammoth_messages.docx"
		);
		await myConverter.convertDocxToHtml();
		myConverter.convertHtmltoJson();
		// await JsonManager.deleteAllJsonFiles("English");
	} catch (error) {
		TerminalLogger.logError(error);
	}

	// const myLogger = new TerminalLogger();
	// myLogger.logEntryToTerminal("English", "agreement");
};

main();
