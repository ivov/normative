import stringify from "json-stringify-pretty-compact";
import { SUPERSCRIPT } from "./constants";

const enumerable = (value: boolean) => {
	return function(
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor
	) {
		descriptor.enumerable = value;
	};
};

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

	// for use in filenames
	@enumerable(false)
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

	@enumerable(false)
	public toJsonString(): string {
		return stringify(this, { indent: 2 });
	}

	@enumerable(false)
	public toObject() {
		let object: { [key: string]: any } = {};
		for (let property in this) {
			object[property] = this[property];
		}
		return object;
	}
}
