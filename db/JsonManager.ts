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
				resolve(filenames)
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
	public static retrieveSummaryOfEntries(language: AvailableLanguages) {
		const data = fs.readFileSync(
			`db/json/${language}/!allEntriesIn${language}.json`
		);
		return JSON.parse(data.toString());
	}

	/**Returns an object parsed from a JSON file.*/
	public static retrieveEntryAsParsedObject(
		language: AvailableLanguages,
		filename: string
	): { [key: string]: any } {
		const data = fs.readFileSync(`db/json/${language}/${filename}`);
		return JSON.parse(data.toString());
	}

	/**Deletes all JSON entries for a given language in its directory.*/
	static async deleteJsonEntries(language: AvailableLanguages): Promise<void> {
		console.log("Deleting current JSON entries...");

		const filenames = await JsonManager.getAllJsonFilenames(language);
		let path = `db/json/${language}/`;

		filenames.forEach(filename => {
			fs.unlink(path + filename, error => {
				if (error) throw error;
			});
		});
		TerminalLogger.logDeletedJsonFiles(language);
	}
}
