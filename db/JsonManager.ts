import fs from "fs";
import { promisify } from "util";
import stringify from "json-stringify-pretty-compact";
import dbLogger from "./dbLogger";
import Entry from "./Entry";

/**Responsible for reading and deleting JSON files.*/
export default class JsonManager {
	/**Returns all JSON filenames for a language, including the summary at the zeroth index.*/
	public static async getAllJsonFilenames(language: AvailableLanguages) {
		const readdir = promisify(fs.readdir);
		const filenames = await readdir(`db/json/${language}/`);
		return filenames.filter(filename => filename !== ".gitignore");
	}

	/**Saves a custom entry as a JSON file.*/
	public static saveEntryAsJson(
		language: AvailableLanguages,
		entry: Entry
	): void {
		const entryAsJsonString = stringify(entry, { indent: 2 });
		const path = `db/json/${language}/${entry.slug}.json`;
		fs.writeFileSync(path, entryAsJsonString, "utf8");
	}

	/**Saves a summary of entries as a JSON file.*/
	public static saveSummaryAsJson(
		language: AvailableLanguages,
		summaryOfEntries: string[]
	): void {
		const allEntriesAsJsonString = stringify(
			{ summary: summaryOfEntries }, // { summary: ["agreement", "appurtenance", etc.] }
			{
				indent: 2
			}
		);
		const path = `db/json/${language}/!allEntriesIn${language}.json`; // "!" to keep file at top
		fs.writeFileSync(path, allEntriesAsJsonString, "utf8");
	}

	/**Returns a summary from a JSON file.*/
	public static getSummaryOfEntries(
		language: AvailableLanguages
	): { summary: string[] } {
		const path = `db/json/${language}/!allEntriesIn${language}.json`;

		if (!fs.existsSync(path)) throw Error("No summary exists for: " + language);

		const data = fs.readFileSync(path);
		return JSON.parse(data.toString());
	}

	/**Parses a JSON file into a JavaScript object.*/
	public static parseJsonIntoObject(
		language: AvailableLanguages,
		jsonFilename: string
	) {
		const data = fs.readFileSync(`db/json/${language}/${jsonFilename}`);
		return JSON.parse(data.toString());
	}

	/**Converts a JSON file into an entry.*/
	public static convertJsonToEntry(
		language: AvailableLanguages,
		jsonFilename: string
	): Entry {
		const parsedObject = this.parseJsonIntoObject(language, jsonFilename);
		const entry = new Entry(parsedObject.term, parsedObject.translation);

		for (let property in parsedObject) {
			if (property !== "term" && property !== "translation")
				entry[property] = parsedObject[property];
		}

		return entry;
	}

	/**Deletes all JSON entries for a given language in its directory.*/
	static async deleteAllJsonFiles(language: AvailableLanguages): Promise<void> {
		console.log(`Deleting JSON entries for ${language}...`);

		const filenames = await JsonManager.getAllJsonFilenames(language);
		const path = `db/json/${language}/`;

		if (filenames.length === 0)
			throw Error(`No JSON files in ${language} to delete.`);

		filenames.forEach(filename => {
			fs.unlink(path + filename, error => {
				if (error) throw Error("Failed to delete: " + path + filename);
			});
		});

		dbLogger.deletedAllJsonFiles(language);
	}
}
