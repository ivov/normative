import fs from "fs";
import { promisify } from "util";
import stringify from "json-stringify-pretty-compact";
import DbLogger from "./DbLogger";
import Entry from "./Entry";

export default class JsonHelper {
	private language: AvailableLanguages;
	private dbLogger: DbLogger;

	constructor(language: AvailableLanguages) {
		this.language = language;
		this.dbLogger =
			language === "English"
				? new DbLogger("English")
				: new DbLogger("Spanish");
	}

	/**Returns all JSON filenames for a language, including the summary at the zeroth index.*/
	public async getAllJsonFilenames() {
		const readdir = promisify(fs.readdir);
		const filenames = await readdir(`db/json/${this.language}/`);
		return filenames.filter(filename => filename !== ".gitignore");
	}

	/**Saves a single entry as a single JSON file.*/
	public saveSingleEntryAsJson(entry: Entry): void {
		const entryAsJsonString = entry.toJsonString();
		const path = `db/json/${this.language}/${entry.slug}.json`;
		fs.writeFileSync(path, entryAsJsonString, "utf8");
	}

	/**Saves all entries as a single JSON file.*/
	public saveAllEntriesAsSingleJson(bigObject: AllEntries): void {
		const title =
			this.language === "English" ? "!allEntriesEnglish" : "!allEntriesSpanish";
		const bigObjectAsJsonString = stringify(bigObject, { indent: 2 });
		const path = `db/json/${this.language}/${title}.json`;
		fs.writeFileSync(path, bigObjectAsJsonString, "utf8");
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
		const title =
			this.language === "English" ? "!summaryEnglish" : "!summarySpanish";

		const allEntriesAsJsonString = stringify(
			{ term: title, summary },
			{
				indent: 2
			}
		);

		const path = `db/json/${this.language}/${title}.json`; // "!" to keep file at the top of the dir
		fs.writeFileSync(path, allEntriesAsJsonString, "utf8");
	}

	/**Returns a summary of entries from a JSON file.*/
	public getSummary(): string[] {
		const path = `db/json/${this.language}/!summary${this.language}.json`;

		if (!fs.existsSync(path))
			throw Error("No summary exists for: " + this.language);

		const object = JSON.parse(fs.readFileSync(path).toString());

		return object.summary;
	}

	/**Parses a JSON file into a JavaScript object.*/
	public parseJsonIntoObject(jsonFilename: string) {
		const data = fs.readFileSync(`db/json/${this.language}/${jsonFilename}`);
		return JSON.parse(data.toString());
	}

	/**Converts a JSON file into an entry.*/
	public convertJsonToEntry(jsonFilename: string): Entry {
		const object = this.parseJsonIntoObject(jsonFilename);
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
		const path = `db/json/${this.language}/`;

		if (filenames.length === 0)
			throw Error(`No JSON files in ${this.language} to delete.`);

		filenames.forEach(filename => {
			fs.unlinkSync(path + filename);
		});

		this.dbLogger.fullGreen(`Deleted all JSON files in ${this.language}`);
	}
}
