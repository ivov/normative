import fs from "fs";
import mammoth from "mammoth";
import cheerio from "cheerio";
import Entry from "../db/models/Entry";
import TerminalLogger from "./TerminalLogger";
import JsonHelper from "./JsonHelper";
import Summary from "../db/models/Summary";
import config from "../config";

/** Responsible for converting the entries in a DOCX file into JSON, either as multiple JSON files or as a single JSON file.*/
export default class DocxParser {
	public language: AvailableLanguages;
	private jsonHelper: JsonHelper;

	public filepath: string;
	public htmlString: string;

	constructor(language: AvailableLanguages, specialFilepath?: string) {
		this.language = language;
		this.jsonHelper = new JsonHelper(language);

		this.filepath = specialFilepath
			? specialFilepath
			: this.language === "English"
			? config.docx.englishFilepath
			: config.docx.spanishFilepath;
	}

	/**Converts a DOCX file into an HTML string and stores it in the `htmlString` class field.*/
	public async convertDocxToHtml() {
		console.log("Converting DOCX to HTML...");

		const result: MammothResult = await mammoth.convertToHtml(
			{ path: this.filepath },
			{
				includeDefaultStyleMap: false,
				styleMap: [
					// Mapping of DOCX tag and styles to custom tagged HTML elements.
					"b => term",
					"r[style-name='Translation Car'] => translation",
					"r[style-name='Definition Car'] => definition",
					"r[style-name='Note Car'] => note"
				]
			}
		);

		if (result.messages.length > 0)
			throw Error(
				"Mammoth messages:\n" +
					result.messages
						.map(obj => `Type: ${obj.type} | Message: ${obj.message}`)
						.join("\n")
			);

		// Replace symbol to make it unique, differentiating it from `Classified under`, which uses `#` as well.
		this.htmlString = result.value.replace(
			/# Classified into:/g,
			"§ Classified into:"
		);

		TerminalLogger.success("Converted DOCX file to HTML string.");
	}

	/**Converts the HTML string in the `htmlString` class field into `cheerioResult`, converts `cheerioResult` into entries and saves entries into a single JSON file or multiple JSON files.
	 * `cheerioResult` is an array of entries of type `CheerioElement` whose most important properties are `type`, `name` and `children`. An entry's `children` are its segments of type `CheerioElement` (`term`, `translation`, `definition`, etc.). Its segments contain subsegments of type `CheerioElement`, either `text` with plain text in `data` or `tag` (emphasis or italics tags) containing plain text in `data`.
	 * ```ts
	 * [
	 *    {
	 *       type: "tag",
	 *       name: "p", ← entry
	 *       ~snip~
	 *       children: [
	 *         {
	 *           type: "tag",
	 *           name: "term", ←—— entry segment
	 *           ~ snip ~
	 *           children: [
	 *             {
	 *                type: "text",
	 *                data: "subpoena", ←—— entry subsegment
	 *                ~ snip ~
	 *             },
	 *             {
	 *                type: "tag",
	 *                name: "em",
	 *                data: "duces tecum", ←—— entry subsegment
	 *                ~ snip ~
	 *             }
	 *           ]
	 *         }
	 *       ]
	 *    },
	 *    ~ snip: more entries ~
	 * ]
	 *```*/
	public convertHtmlToJson(options: {
		toSingleJsonFile?: boolean;
		toMultipleJsonFiles?: boolean;
	}) {
		console.log("Converting HTML to JSON...");

		const $ = cheerio.load(this.htmlString);
		const cheerioResult = Array.from($("p"));

		const summary = new Summary(this.language);
		const allEntriesObject: AllEntriesObject = { allEntries: [] };

		for (let [index, cheerioEntry] of cheerioResult.entries()) {
			const entry = Entry.createFromCheerio(cheerioEntry);

			allEntriesObject.allEntries.push(entry.toObject());

			TerminalLogger.savingJson({
				counter: index++,
				total: cheerioResult.length,
				term: entry.term
			});

			summary.addTerm(entry.term);
		}

		options.toSingleJsonFile
			? this.jsonHelper.saveAllEntriesAsSingleJsonFile(allEntriesObject)
			: this.jsonHelper.saveAllEntriesAsMultipleJsonFiles(allEntriesObject);

		summary.checkForDuplicates();
		this.jsonHelper.saveSummaryAsJson(summary);

		TerminalLogger.success(
			`Converted ${cheerioResult.length} entries in ${this.language} to JSON.`
		);
	}
}
