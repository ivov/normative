import path from "path";
import fs from "fs";
import { promisify } from "util";
import prettyStringify from "json-stringify-pretty-compact";
import Entry from "../db/models/Entry";
import Summary from "../db/models/Summary";
import { SUMMARY_TERM } from "./constants";

export default class JsonHelper {
	private language: AvailableLanguages;

	private jsonDir: string;
	public allEntriesFilename: string;
	private summaryFilename: string;

	constructor(language: AvailableLanguages) {
		this.language = language;

		this.jsonDir = path.join("conversion", "json", this.language);

		this.allEntriesFilename =
			this.language === "English"
				? "!allEntriesEnglish.json"
				: "!allEntriesSpanish.json"; // "!" to keep file at the top of the dir

		this.summaryFilename =
			this.language === "English"
				? "!summaryEnglish.json"
				: "!summarySpanish.json"; // "!" to keep file at the top of the dir
	}

	/**Returns all JSON filenames for a language, including the summary at the zeroth index.*/
	public async getAllJsonFilenames() {
		const readdir = promisify(fs.readdir);
		const filenames = await readdir(this.jsonDir);
		return filenames.filter(filename => filename !== ".gitignore");
	}

	public getBigObjectFromSingleJsonFile(): AllEntriesObject {
		const sourcePath = path.join(this.jsonDir, this.allEntriesFilename);
		return JSON.parse(fs.readFileSync(sourcePath).toString());
	}

	public saveAllEntriesAsSingleJsonFile(allEntriesObject: AllEntriesObject) {
		const jsonString = prettyStringify(allEntriesObject, { indent: 2 });
		const destinationPath = path.join(this.jsonDir, this.allEntriesFilename);
		fs.writeFileSync(destinationPath, jsonString, "utf8");
	}

	public saveAllEntriesAsMultipleJsonFiles(allEntriesObject: AllEntriesObject) {
		for (let entryObject of allEntriesObject.allEntries) {
			const jsonString = prettyStringify(entryObject, { indent: 2 });
			const destinationPath = path.join(
				this.jsonDir,
				entryObject.slug + ".json"
			);
			fs.writeFileSync(destinationPath, jsonString, "utf8");
		}
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
	public saveSummaryAsJson(summary: Summary) {
		const summaryTerm = SUMMARY_TERM[this.language];

		const jsonString = prettyStringify(
			{ term: summaryTerm, summary: summary.getTerms() },
			{ indent: 2 }
		);

		const destinationPath = path.join(this.jsonDir, this.summaryFilename);
		fs.writeFileSync(destinationPath, jsonString, "utf8");
	}

	/**Returns a summary of entries from a JSON file.*/
	public getSummary(): Summary {
		const sourcePath = path.join(this.jsonDir, this.summaryFilename);

		if (!fs.existsSync(sourcePath))
			throw Error("No summary exists for: " + this.language);

		const object = JSON.parse(fs.readFileSync(sourcePath).toString());

		const summary = new Summary(this.language);
		summary.populate(object);

		return summary;
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

		console.log(`Deleted all JSON files in ${this.language}`);
	}
}
