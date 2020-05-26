import minimist from "minimist";
import DocxParser from "./DocxParser";
import JsonHelper from "./JsonHelper";
import TerminalLogger from "./TerminalLogger";
import MongoDB from "../db/MongoDB";
import FirestoreDB from "../db/FirestoreDB";

/**Responsible for receiving CLI arguments and calling the corresponding functions.
 * - `--language`: Set the target DOCX file, JSON file(s) and MongoDB collection. Required for all operations.
 * - `--convert`: Convert the DOCX file into a single JSON file or to multiple JSON files.
 * - `--uploadMongo`: Upload to MongoDB from a single JSON file or from multiple JSON files.
 * - `--uploadFirestore`: Upload to Firestore from a single JSON file or from multiple JSON files.
 * - `--deleteJson`: Delete all JSON files in the relevant JSON directory.
 * - `--deleteMongo`: Delete all documents in the relevant MongoDB collection.
 * - `--deleteFirestore`: Delete all documents in the relevant Firestore collection.
 * - `--retrieveEntry`: Retrieve an entry from JSON and log it to the console.
 * */
export default class Cli {
	args: minimist.ParsedArgs;

	constructor() {
		this.args = this.getArgs();
	}

	/**Dispatches operation based on CLI arg.*/
	public async init() {
		if (this.args.convert) await this.convert();
		if (this.args.uploadMongo) await this.uploadMongo();
		if (this.args.uploadFirestore) await this.uploadFirestore();
		if (this.args.deleteMongo) this.deleteMongo();
		if (this.args.deleteJson) await this.deleteJson();
		if (this.args.deleteFirestore) await this.deleteFirestore();
		if (this.args.retrieveEntry) await this.retrieveEntry();
	}

	/**Receives CLI args and parse them into an object.*/
	private getArgs(): minimist.ParsedArgs {
		const args = minimist(process.argv.slice(2), {
			string: [
				"language",
				"convert",
				"uploadMongo",
				"uploadFirestore",
				"retrieveEntry"
			],
			boolean: ["deleteJson", "deleteMongo", "deleteFirestore"]
		});

		this.validateArgs(args);

		return args;
	}

	/**Checks that all flags passed to the convert or upload operation are correct.*/
	private validateArgs(args: minimist.ParsedArgs) {
		if (!args.language) throw Error("The --language flag is required.");

		if (!args.language.match(/English|Spanish/))
			throw Error("Arg for --language flag must be 'English' or 'Spanish'.");

		if (
			(args.convert && !args.convert.match(/single|multiple/)) ||
			(args.upload && !args.upload.match(/single|multiple/))
		)
			throw Error("Arg for --convert flag must be 'single' or 'multiple'.");
	}

	/**Converts DOCX file to a single JSON file or to multiple JSON files.*/
	private async convert() {
		const parser = new DocxParser(this.args.language);
		await parser.convertDocxToHtml();

		parser.convertHtmlToJson(
			this.args.convert === "single"
				? { toSingleJsonFile: true }
				: { toMultipleJsonFiles: true }
		);
	}

	/**Uploads all documents to the relevant MongoDB collection.*/
	private async uploadMongo() {
		const db = new MongoDB(this.args.language);
		await db.init();

		await db.uploadAll(
			this.args.uploadMongo === "single"
				? { fromSingleJsonFile: true }
				: { fromMultipleJsonFiles: true }
		);

		await db.disconnect();
	}

	/**Uploads all documents to the relevant Firestore collection.*/
	private async uploadFirestore() {
		const db = new FirestoreDB(this.args.language);

		await db.uploadAll(
			this.args.uploadMongo === "single"
				? { fromSingleJsonFile: true }
				: { fromMultipleJsonFiles: true }
		);

		db.disconnect();
	}

	/**Deletes all documents in the relevant mongo DB collection.*/
	private async deleteMongo() {
		const db = new MongoDB(this.args.language);
		await db.init();
		await db.deleteAll();
		await db.disconnect();
	}

	/**Deletes all documents in the relevant Firestore collection.*/
	private async deleteFirestore() {
		const db = new FirestoreDB(this.args.language);
		await db.deleteAll();
		db.disconnect();
	}

	/**Deletes all documents in the relevant JSON directory.*/
	private async deleteJson() {
		const jsonHelper = new JsonHelper(this.args.language);
		jsonHelper.deleteAllJsonFiles();
	}

	/**Retrieves an entry and logs it to the console.*/
	private async retrieveEntry() {
		const terminalLogger = new TerminalLogger(this.args.language);
		terminalLogger.logEntry(this.args.retrieveEntry);
	}
}
