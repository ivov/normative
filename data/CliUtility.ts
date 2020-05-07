import minimist from "minimist";
import WordToJsonConverter from "./WordToJsonConverter";
import MongoManager from "./MongoManager";
import JsonHelper from "./JsonHelper";

/**Responsible for receiving CLI arguments and calling the corresponding functions.
 * - `--language` → `English` or `Spanish`
 * Set the target DOCX file, JSON file(s) and MongoDB collection. Required for all operations.
 *
 * - `--convert` → `single` or `multiple`
 * Convert the DOCX file into a single JSON file or to multiple JSON files.
 *
 * - `--uploadMongo` → `single` or `multiple`
 * Upload to MongoDB from a single JSON file or from multiple JSON files)
 *
 * - `--deleteJson`
 * Delete all JSON files in the relevant JSON directory.
 *
 * - `--deleteMongo`
 * Delete all documents in the relevant MongoDB collection.
 */
export default class CliUtility {
	args: minimist.ParsedArgs;

	constructor() {
		this.args = this.getArgs();
	}

	/**Dispatches operation based on CLI args.*/
	public async init() {
		const { convert, uploadMongo, deleteMongo, deleteJson } = this.args;

		if (convert) await this.convert();
		if (uploadMongo) await this.uploadMongo();
		if (deleteMongo) this.deleteMongo();
		if (deleteJson) await this.deleteJson();
	}

	/**Receives CLI args and parse them into an object. Excludes the runtime path and script path automatically passed.*/
	private getArgs(): minimist.ParsedArgs {
		const args = minimist(process.argv.slice(2), {
			string: ["language", "convert", "uploadMongo"],
			boolean: ["deleteJson", "deleteMongo"]
		});
		this.argsCheck(args);

		return args;
	}

	/**Checks that all flags passed to the convert or upload operation are correct.*/
	private argsCheck(args: minimist.ParsedArgs) {
		if (!args.language) throw Error("The --language flag is required.");

		if (!args.language.match(/English|Spanish/))
			throw Error("Arg for --language flag must be 'English' or 'Spanish'.");

		const regex = /single|multiple/;

		if (
			(args.convert && !args.convert.match(regex)) ||
			(args.upload && !args.upload.match(regex))
		)
			throw Error("Arg for --convert flag must be 'single' or 'multiple'.");
	}

	/**Converts DOCX file to a single JSON file or to multiple JSON files.*/
	private async convert() {
		const converter = new WordToJsonConverter(this.args.language);
		await converter.convertDocxToHtml();

		converter.convertHtmlToJson(
			this.args.convert === "single"
				? { toSingleJsonFile: true }
				: { toMultipleJsonFiles: true }
		);
	}

	private async uploadMongo() {
		const mongoManager = new MongoManager("English");
		await mongoManager.init();

		await mongoManager.uploadAll(
			this.args.uploadMongo === "single"
				? { fromSingleJsonFile: true }
				: { fromMultipleJsonFiles: true }
		);

		await mongoManager.disconnect();
	}

	/**Deletes all documents in the relevant mongo DB collection.*/
	private async deleteMongo() {
		const mongoManager = new MongoManager(this.args.language);
		await mongoManager.init();
		await mongoManager.deleteAllDocuments();
		await mongoManager.disconnect();
	}

	/**Deletes all documents in the relevant JSON directory.*/
	private async deleteJson() {
		const jsonHelper = new JsonHelper(this.args.language);
		jsonHelper.deleteAllJsonFiles();
	}
}
