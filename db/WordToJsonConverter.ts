import fs from "fs";
import mammoth from "mammoth";
import cheerio from "cheerio";
import dotenv from "dotenv";
// import { XmlEntities } from "html-entities";
import {
	SUPERSCRIPT,
	LOOSE_FIELD_SYMBOLS,
	LOOSE_FIELD_KEYS
} from "./constants";
import Entry from "./Entry";
import DbLogger from "./DbLogger";
import JsonHelper from "./JsonHelper";

/** Responsible for converting the entries in a DOCX file into an HTML string and it into multiple JSON files.*/
export default class WordToJsonConverter {
	public language: AvailableLanguages;
	public filepath: string;
	public htmlString: string;
	// private htmlEncoder: any = new XmlEntities(); // no need to encode for now
	private dbLogger: DbLogger;
	private jsonHelper: JsonHelper;

	constructor(language: AvailableLanguages, specialFilePath?: string) {
		this.language = language;

		// Filepath for source DOCX file: either special for testing or ordinary from dotenv.
		this.filepath = specialFilePath
			? specialFilePath
			: this.getFilePathFromDotEnv();

		this.dbLogger =
			language === "English"
				? new DbLogger("English")
				: new DbLogger("Spanish");

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

	/**Converts a DOCX file into an HTML string and stores it in the `htmlString` class field. Current JSON entries are deleted.*/
	public async convertDocxToHtml() {
		// await jsonHelper.deleteJsonEntries(this.language);

		console.log("Converting DOCX to HTML...");

		const result: MammothResult = await mammoth.convertToHtml(
			{ path: this.filepath },
			{
				includeDefaultStyleMap: false,
				styleMap: [
					// Mapping of `docx` tag and styles to custom tagged HTML elements.
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
			/# Classified into:/g, // make symbol unique to make later recognition easier
			"§ Classified into:" // because `Classified under` uses # as well
		);

		this.dbLogger.fullGreen("Converted DOCX file to HTML string.");
	}

	/**Converts a long HTML string into multiple entries and persists them as JSON files. The intermediate step between HTML and JSON is `cheerioResult`. `cheerioResult` is an array of entries of type `CheerioElement` containing the properties `type`, `name` and `children`. An entry's `children` are its segments of type `CheerioElement` (`term`, `translation`, `definition`, etc.). Its segments contain subsegments of type `CheerioElement`, either `text` with plain text in `data` or `tag` (emphasis or italics tags) containing plain text in `data`.
	 * ```ts
	 * [
	 *    {
	 *       type: "tag",
	 *       name: "p", ← entry
	 *       ~snip~
	 *       children: [
	 *         {
	 *           type: "tag",
	 *           name: "term", ← entry segment
	 *           ~ snip ~
	 *           children: [
	 *             {
	 *                type: "text",
	 *                data: "lawyer", ← entry subsegment
	 *                ~ snip ~
	 *             },
	 *             {
	 *                type: "tag",
	 *                name: "em",
	 *                data: "sine qua non", ← entry subsegment
	 *                ~ snip ~
	 *             }
	 *           ]
	 *         }
	 *       ]
	 *    },
	 *    ~ snip: more entries ~
	 * ]
	 *```
	 */
	public convertHtmltoJson(options?: { oneJsonFile: boolean }) {
		console.log("Converting HTML to JSON...");

		const $ = cheerio.load(this.htmlString);
		const cheerioResult = Array.from($("p"));
		this.checkForDuplicates(cheerioResult);

		let summaryOfEntries: string[] = [];
		let bigObject: AllEntries = {
			allEntries: []
		};

		for (let [index, cheerioEntry] of cheerioResult.entries()) {
			let entry = this.createEntry(cheerioEntry);

			if (options && options.oneJsonFile) {
				bigObject.allEntries.push(entry.toObject());
			} else {
				this.jsonHelper.saveSingleEntryAsJson(entry);
			}

			this.dbLogger.savingJson({
				counter: index + 1,
				total: cheerioResult.length,
				slug: entry.slug
			});

			summaryOfEntries.push(entry.slug);
			// break; // temp, to show only one entry for debugging
		}

		if (options && options.oneJsonFile)
			this.jsonHelper.saveAllEntriesAsSingleJson(bigObject);

		this.jsonHelper.saveSummaryAsJson(summaryOfEntries);
		this.dbLogger.fullGreen(
			`Converted HTML string to ${summaryOfEntries.length} JSON files.`
		);
	}

	/**Checks for duplicates in the terms of the entries in `CheerioResult` and exits if duplicates are found.*/
	private checkForDuplicates(cheerioResult: CheerioElement[]): void {
		let entryTerms: string[] = [];
		for (let cheerioEntry of cheerioResult) {
			for (let child of cheerioEntry.children) {
				if (child.type === "tag") {
					if (child.name === "term") {
						const term = this.getTaggedFieldText(child);
						entryTerms.push(term);
					}
				}
			}
		}

		const containsDuplicates = (array: string[]) =>
			array.length !== new Set(array).size;

		const identifyDuplicates = (array: string[]) =>
			array.filter(
				(item: string, index: number) => array.indexOf(item) != index
			);

		if (containsDuplicates(entryTerms)) {
			const duplicates = identifyDuplicates(entryTerms);
			throw Error("Duplicates found:\n" + duplicates.join(", "));
		}
		return;
	}

	public createEntry(cheerioEntry: CheerioElement): Entry {
		let entry: Entry;

		const { term, translation, definition, note } = this.getTaggedSnippets(
			cheerioEntry
		);
		entry = new Entry(term, translation, definition, note);

		try {
			const looseSnippets = this.getLooseSnippets(cheerioEntry);
			this.addLooseFieldsToEntry(looseSnippets, entry);
			return entry;
		} catch (error) {
			throw Error("Failed to process loose snippets for: " + entry.term);
		}
	}

	/**Extracts all text snippets from cheerio entry as long as the snippets are tagged (`term`, `translation`, `definition`, `note`).*/
	private getTaggedSnippets(cheerioEntry: CheerioElement): TaggedSnippets {
		let tagged: TaggedSnippets = {
			term: "",
			translation: "",
			definition: "",
			note: ""
		};

		for (let child of cheerioEntry.children) {
			if (child.type === "tag") {
				for (let name of ["term", "translation", "definition", "note"]) {
					if (child.name === name) {
						tagged[name] = this.getTaggedFieldText(child);
					}
				}
			}
		}

		if (tagged.term === "" && tagged.translation === "")
			throw Error("This paragraph is not an entry.");

		if (tagged.term === "")
			throw Error("Failed to find term for translation: " + tagged.translation);

		if (tagged.translation === "")
			throw Error("Failed to find translation for term: " + tagged.term);

		return tagged;
	}

	/**Get the text of a tagged field and returns the text, or an empty string if the tagged field does not exist.*/
	private getTaggedFieldText(taggedSegment: CheerioElement): string {
		let text = "";
		for (let child of taggedSegment.children) {
			text += this.extractText(child);
		}
		return text;
	}

	/**Extracts the text from an element and returns it. Adds `<i>` tags for text in italics. Adds `<sup>` tags for alphabetic superscript. Replaces ordinary number with superscript number. Encodes `>` and `<` characters into `&gt;` and `&lt;`, etc.*/
	private extractText(element: CheerioElement): string {
		let text = "";

		if (
			element.type === "text" ||
			(element.type === "tag" && element.name === "em") ||
			(element.type === "tag" && element.name === "sup")
		) {
			if (element.type === "text") {
				// text += this.htmlEncoder.encode(element.data); // no need to encode for now
				text += element.data;
			} else if (element.type === "tag") {
				const tagContent = element.children[0].data as string;
				switch (element.name) {
					case "sup":
						// if numeric superscript
						if (!isNaN(+tagContent)) {
							text += SUPERSCRIPT[+tagContent];
						}
						// if alphabetic superscript
						else {
							text += "<sup>" + tagContent + "</sup>";
						}

						break;
					case "em":
						text +=
							"<i>" +
							// this.htmlEncoder.encode(element.children[0].data) + // no need to encode for now
							element.children[0].data +
							"</i>";
						break;
				}
			}
		} else {
			const problemEntry = element.parent.parent.children[0].children[0]
				.data as string;
			throw Error(
				`Unrecognized element type, neither "tag" nor "text".\nLook for styled line breaks in the entry: ${problemEntry}`
			);
		}
		return text;
	}

	/**Extracts all text snippets from a cheerio entry as long as the snippets are not part of a tagged field (`term`, `translation`, `definition`, `note`). It avoids tagged fields by excluding `child.type === "tag"` from the condition in the loop.*/
	private getLooseSnippets(cheerioEntry: CheerioElement): string[] {
		let buffer: string[] = []; // accumulates parts of field
		let looseFields: string[] = [];

		for (let child of cheerioEntry.children) {
			if (child.name === "br") {
				if (buffer.length > 0) {
					const fieldLine = buffer.join("").replace("\t", "");
					looseFields.push(fieldLine);
				}
				buffer = []; // empty out buffer at `<br>` (line break)
			} else if (
				child.type === "text" ||
				(child.type === "tag" && child.name === "em") ||
				(child.type === "tag" && child.name === "sup")
			) {
				if (child.data === " — ") continue; // ignore misc character in first line
				if (child.data === "\t") continue; // ignore misc character in first line

				let fieldText = this.extractText(child);
				buffer.push(fieldText);
			}
		}

		// add last item in buffer, only item not ending in `<br>`
		if (buffer.length > 0) {
			looseFields.push(buffer.join("").replace("\t", ""));
		}

		return looseFields;
	}

	/** Adds loose fields to the entry. Loose fields are untagged and may be: (1) basic link fields (`similarTo`, `tantamountTo`, `differentFrom`, `derivedFrom`, `derivedInto`), which may appear only once; (2) reference text fields (`reference`), which may appear more than once; or (3) complex link fields (`classifiedUnder`, `classifiedInto`), which may appear more than once.*/
	private addLooseFieldsToEntry(looseSnippets: string[], entry: Entry) {
		let basicLinkSnippets: string[] = [];
		let referenceTextSnippets: string[] = [];
		let complexLinkSnippets: string[] = [];

		const isBasicLink = (snippet: string) =>
			snippet.startsWith(LOOSE_FIELD_SYMBOLS.similarTo) ||
			snippet.startsWith(LOOSE_FIELD_SYMBOLS.tantamountTo) ||
			snippet.startsWith(LOOSE_FIELD_SYMBOLS.differentFrom) ||
			snippet.startsWith(LOOSE_FIELD_SYMBOLS.derivedFrom) ||
			snippet.startsWith(LOOSE_FIELD_SYMBOLS.derivedInto);

		const isReferenceText = (snippet: string) =>
			snippet.startsWith(LOOSE_FIELD_SYMBOLS.reference);

		const isComplexLink = (snippet: string) =>
			snippet.startsWith(LOOSE_FIELD_SYMBOLS.classifiedUnder) ||
			snippet.startsWith(LOOSE_FIELD_SYMBOLS.classifiedInto);

		for (let snippet of looseSnippets) {
			if (isBasicLink(snippet)) basicLinkSnippets.push(snippet);
			if (isReferenceText(snippet)) referenceTextSnippets.push(snippet);
			if (isComplexLink(snippet)) complexLinkSnippets.push(snippet);
		}

		if (basicLinkSnippets.length > 0)
			this.addBasicLinkFields(entry, basicLinkSnippets);

		if (referenceTextSnippets.length > 0)
			this.addReferenceField(entry, referenceTextSnippets);

		if (complexLinkSnippets.length > 0)
			this.addComplexLinkFields(entry, complexLinkSnippets);
	}

	/** Adds each basic link field as an array of strings to the entry.*/
	private addBasicLinkFields(entry: Entry, basicLinkSnippets: string[]): void {
		for (let snippet of basicLinkSnippets) {
			let [field, content] = snippet.split(": ");
			let key = LOOSE_FIELD_KEYS[field];
			entry[key] = this.convertToStringArray(content);
		}
	}

	private convertToStringArray(snippet: string): string[] {
		return snippet.split("|").map(item => item.trim());
	}

	/** Adds all reference text fields as an array of strings to the entry.*/
	private addReferenceField(entry: Entry, referenceSnippets: string[]) {
		entry.reference = referenceSnippets.map(snippet =>
			snippet.replace("+ ", "")
		);
	}

	/**Adds each complex link field as an array of objects (each containing the string `"contents"` as key and an array of strings as value) to the custom entry object. This redundant `"contents"` is necessary because **Firestore does not support directly nested arrays**. See: https://github.com/firebase/firebase-js-sdk/issues/193#issuecomment-338075348
	 * ```json
	 * {
	 *     "classifiedInto":
	 *         [
	 *             { "contents": [ "unilateral act",  "bilateral act" ] },
	 *             { "contents": [ "criminal act act",  "tortious act" ] }
	 *         ]
	 * }
	 * ```
	 */
	private addComplexLinkFields(
		entry: Entry,
		complexLinkSnippets: string[]
	): void {
		let fields: { [key: string]: { contents: string[] }[] } = {
			classifiedUnder: [],
			classifiedInto: []
		};
		for (let snippet of complexLinkSnippets) {
			let [field, content] = snippet.split(": ");
			let line = { contents: this.convertToStringArray(content) };

			let key = LOOSE_FIELD_KEYS[field];
			fields[key].push(line);
		}

		if (fields.classifiedUnder.length > 0)
			entry.classifiedUnder = fields.classifiedUnder;

		if (fields.classifiedInto.length > 0)
			entry.classifiedInto = fields.classifiedInto;
	}
}
