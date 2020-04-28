import fs from "fs";
import stringify from "json-stringify-pretty-compact";
import TerminalLogger from "../logging/TerminalLogger";
import Entry from "./Entry";

/**Responsible for reading and deleting JSON files.*/
export default class JsonManager {
	/**Returns a resolved Promise of all JSON filenames for a language, with the summary at the zeroth index.*/
	public static getAllJsonFilenames(
		language: AvailableLanguages
	): Promise<string[]> {
		return new Promise((resolve, reject) => {
			return fs.readdir(`db/json/${language}/`, (error, filenames: string[]) =>
				resolve(filenames.filter(filename => filename !== ".gitignore"))
			);
		});
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
		const allEntriesAsJsonString = stringify(summaryOfEntries, {
			indent: 2
		});
		const path = `db/json/${language}/!allEntriesIn${language}.json`; // "!" to keep file at top
		fs.writeFileSync(path, allEntriesAsJsonString, "utf8");
	}

	/**Returns a summary from a JSON file.*/
	public static getSummaryOfEntries(language: AvailableLanguages): string[] {
		const data = fs.readFileSync(
			`db/json/${language}/!allEntriesIn${language}.json`
		);
		return JSON.parse(data.toString());
	}

	/**Converts a JSON file into an entry.*/
	public static convertJsonToEntry(
		language: AvailableLanguages,
		filename: string
	): Entry {
		const data = fs.readFileSync(`db/json/${language}/${filename}`);
		const parsedObject = JSON.parse(data.toString());
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

		TerminalLogger.logDeletedJsonFiles(language);
	}
}
