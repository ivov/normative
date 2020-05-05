import path from "path";
import fs from "fs";
import { promisify } from "util";
import prettyStringify from "json-stringify-pretty-compact";
import DataLogger from "./DataLogger";
import Entry from "./Entry";

export default class JsonHelper {
	private language: AvailableLanguages;
	private dataLogger: DataLogger;
	private jsonDir: string;

	constructor(language: AvailableLanguages) {
		this.language = language;
		this.jsonDir = path.join("data", "json", this.language);
		this.dataLogger =
			language === "English"
				? new DataLogger("English")
				: new DataLogger("Spanish");
	}

	/**Returns all JSON filenames for a language, including the summary at the zeroth index.*/
	public async getAllJsonFilenames() {
		const readdir = promisify(fs.readdir);
		const filenames = await readdir(this.jsonDir);
		return filenames.filter(filename => filename !== ".gitignore");
	}

	public getBigObjectFromSingleJsonFile(): bigObjectOfAllEntries {
		const specialTerm =
			this.language === "English" ? "!allEntriesEnglish" : "!allEntriesSpanish";
		const sourcePath = path.join(
			"data",
			"json",
			this.language,
			specialTerm + ".json"
		);
		return JSON.parse(fs.readFileSync(sourcePath).toString());
	}

	/**Saves a single entry as a single JSON file.*/
	public saveSingleEntryAsJson(entry: Entry): void {
		const entryAsJsonString = entry.toJsonString();
		const destinationPath = path.join(this.jsonDir, entry.slug + ".json");
		fs.writeFileSync(destinationPath, entryAsJsonString, "utf8");
	}

	/**Saves all entries as a single JSON file.*/
	public saveAllEntriesAsSingleJson(bigObject: bigObjectOfAllEntries): void {
		const title =
			this.language === "English" ? "!allEntriesEnglish" : "!allEntriesSpanish";
		const bigObjectAsJsonString = prettyStringify(bigObject, { indent: 2 });
		const destinationPath = path.join(this.jsonDir, title + ".json");
		fs.writeFileSync(destinationPath, bigObjectAsJsonString, "utf8");
	}

	/**Saves a summary of entries as a JSON file.
	 * ```ts
	 * {
	 *     term: "!summaryEnglish",
	 *     summary: [
	 *         "agreement",
	 *         "appurtenance",
	 *         ~ snip ~
	 *     ]
	 * }
	 * ```
	 */
	public saveSummaryAsJson(summary: string[]): void {
		// "!" to keep file at the top of the dir
		const title =
			this.language === "English" ? "!summaryEnglish" : "!summarySpanish";

		const allEntriesAsJsonString = prettyStringify(
			{ term: title, summary },
			{
				indent: 2
			}
		);

		const destinationPath = path.join(this.jsonDir, title + ".json");
		fs.writeFileSync(destinationPath, allEntriesAsJsonString, "utf8");
	}

	/**Returns a summary of entries from a JSON file.*/
	public getSummary(): string[] {
		const title =
			this.language === "English" ? "!summaryEnglish" : "!summarySpanish";

		const sourcePath = path.join(this.jsonDir, title + ".json");

		if (!fs.existsSync(sourcePath))
			throw Error("No summary exists for: " + this.language);

		const object = JSON.parse(fs.readFileSync(sourcePath).toString());

		return object.summary;
	}

	/**Parses a JSON file into a JavaScript object.*/
	public convertJsonToObject(jsonFilename: string) {
		const sourcePath = path.join(this.jsonDir, jsonFilename);
		const data = fs.readFileSync(sourcePath);
		return JSON.parse(data.toString());
	}

	/**Converts a JSON file into an entry.*/
	public convertJsonToEntry(jsonFilename: string): Entry {
		const object = this.convertJsonToObject(jsonFilename);
		const entry = new Entry(object.term, object.translation);

		for (let property in object) {
			if (property !== "term" && property !== "translation")
				entry[property] = object[property];
		}

		return entry;
	}

	/**Deletes all JSON entries for a given language in its directory.*/
	async deleteAllJsonFiles() {
		console.log(`Deleting JSON entries for ${this.language}...`);

		const filenames = await this.getAllJsonFilenames();

		if (filenames.length === 0)
			throw Error(`No JSON files in ${this.language} to delete.`);

		filenames.forEach(filename => {
			fs.unlinkSync(path.join(this.jsonDir, filename));
		});

		this.dataLogger.fullGreen(`Deleted all JSON files in ${this.language}`);
	}
}
