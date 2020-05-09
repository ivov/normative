import fs from "fs";
import mammoth from "mammoth";
import cheerio from "cheerio";
import dotenv from "dotenv";
import Entry from "../db/models/Entry";
import Logger from "../logs/Logger";
import JsonHelper from "../utils/JsonHelper";
import Summary from "../db/models/Summary";
// import { XmlEntities } from "html-entities";

/** Responsible for converting the entries in a DOCX file into JSON, either as multiple JSON files or as a single JSON file.*/
export default class WordToJsonConverter {
	public language: AvailableLanguages;
	public filepath: string;
	public htmlString: string;
	private logger: Logger;
	private jsonHelper: JsonHelper;
	// private htmlEncoder: any = new XmlEntities(); // no need to encode for now

	constructor(language: AvailableLanguages, specialFilePath?: string) {
		this.language = language;

		this.filepath = specialFilePath
			? specialFilePath
			: this.getFilePathFromDotEnv();

		this.logger =
			language === "English" ? new Logger("English") : new Logger("Spanish");

		this.jsonHelper =
			language === "English"
				? new JsonHelper("English")
				: new JsonHelper("Spanish");
	}

	private getFilePathFromDotEnv(): string {
		dotenv.config();

		if (!fs.existsSync(".env"))
			throw Error("No dotenv file found at root dir.");

		if (!process.env.DOCX_PATH_ENGLISH || !process.env.DOCX_PATH_SPANISH)
			throw Error("DOCX file path missing from dotenv file.");

		const filepath =
			this.language === "English"
				? process.env.DOCX_PATH_ENGLISH
				: process.env.DOCX_PATH_SPANISH;

		if (!fs.existsSync(filepath))
			throw Error("DOCX file path in dotenv file does not exist.");

		return filepath;
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

		this.htmlString = result.value.replace(
			/# Classified into:/g,
			"§ Classified into:"
		); // This makes the initial symbol unique to facilitate later recognition. (`Classified under` uses `#` as well.)

		this.logger.fullGreen("Converted DOCX file to HTML string.");
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

			this.logger.savingJson({
				counter: index + 1,
				total: cheerioResult.length,
				slug: entry.slug
			});

			summary.addTerm(entry.term);
		}

		if (options.toSingleJsonFile) {
			this.jsonHelper.saveAllEntriesAsSingleJsonFile(allEntriesObject);
		} else {
			this.jsonHelper.saveAllEntriesAsMultipleJsonFiles(allEntriesObject);
		}

		summary.checkForDuplicates();
		this.jsonHelper.saveSummaryAsJson(summary);
	}
}
