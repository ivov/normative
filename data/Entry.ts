import prettyStringify from "json-stringify-pretty-compact";
import {
	SUPERSCRIPT,
	LOOSE_FIELD_KEYS,
	LOOSE_FIELD_SYMBOLS
} from "./constants";
import CheerioExtractor from "./CheerioExtractor";

/**Represents an entry in the dictionary. Enables conversion into JSON string and into JS object. Enables static creation from a `cheerioEntry`, one of the constituents of a `cheerioResult`.*/
export default class Entry {
	term: string;
	translation: string;
	slug: string;
	note?: string;
	definition?: string;
	similarTo?: string[];
	classifiedUnder?: { contents: string[] }[];
	classifiedInto?: { contents: string[] }[];
	tantamountTo?: string[];
	differentFrom?: string[];
	derivedFrom?: string[];
	derivedInto?: string[];
	reference?: string[];

	[key: string]:
		| string
		| string[]
		| { contents: string[] }[]
		| undefined
		| Function;

	constructor(
		term: string,
		translation: string,
		definition?: string,
		note?: string
	) {
		this.term = term;
		this.translation = translation;

		if (definition !== undefined && definition !== "")
			this.definition = definition.replace("• ", "");

		if (note !== undefined && note !== "") this.note = note.replace("» ", "");

		this.slug = this.buildSlug(term);
	}

	private buildSlug(term: string): string {
		term = term.replace(/<i>|<\/i>|\.|:|\//g, ""); // chars disallowed in a filename
		term = term.replace(/"/g, "'");

		const lastCharacter = term.slice(-1);
		if (SUPERSCRIPT.includes(lastCharacter)) {
			const newLastCharacter = SUPERSCRIPT.indexOf(lastCharacter);
			term = term.slice(0, -1) + newLastCharacter;
		}

		return term;
	}

	public toJsonString(): string {
		return prettyStringify(this, { indent: 2 });
	}

	public toObject() {
		let object: { [key: string]: any } = {};
		for (let property in this) {
			object[property] = this[property];
		}
		return object;
	}

	public static createFromCheerio(cheerioEntry: CheerioElement): Entry {
		const extractor = new CheerioExtractor();
		const { term, translation, definition, note } = extractor.getTaggedSnippets(
			cheerioEntry
		);
		const entry = new Entry(term, translation, definition, note);

		try {
			const looseSnippets = extractor.getLooseSnippets(cheerioEntry);
			this.addLooseFieldsToEntry(looseSnippets, entry);
			return entry;
		} catch (error) {
			throw Error("Failed to process loose snippets for: " + entry.term);
		}
	}

	/** Adds loose fields to the entry. Loose fields are untagged and may be: (1) basic link fields (`similarTo`, `tantamountTo`, `differentFrom`, `derivedFrom`, `derivedInto`), which may appear only once; (2) reference text fields (`reference`), which may appear more than once; or (3) complex link fields (`classifiedUnder`, `classifiedInto`), which may appear more than once.*/
	private static addLooseFieldsToEntry(looseSnippets: string[], entry: Entry) {
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
	private static addBasicLinkFields(
		entry: Entry,
		basicLinkSnippets: string[]
	): void {
		for (let snippet of basicLinkSnippets) {
			let [field, content] = snippet.split(": ");
			let key = LOOSE_FIELD_KEYS[field];
			entry[key] = this.convertToStringArray(content);
		}
	}

	private static convertToStringArray(snippet: string): string[] {
		return snippet.split("|").map(item => item.trim());
	}

	/** Adds all reference text fields as an array of strings to the entry.*/
	private static addReferenceField(entry: Entry, referenceSnippets: string[]) {
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
	public static addComplexLinkFields(
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
