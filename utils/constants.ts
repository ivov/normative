export const SUPERSCRIPT = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];

export const SUMMARY_TERM = {
	English: "!summaryEnglish",
	Spanish: "!summarySpanish"
};

export const LOOSE_FIELD_SYMBOLS: {
	[key: string]: string;
} = {
	similarTo: "\u007E",
	classifiedUnder: "#",
	classifiedInto: "\u00A7", // §, but originally "#""
	derivedFrom: "\u2190",
	derivedInto: "\u2192",
	tantamountTo: "\u25AB",
	differentFrom: "\u00D7",
	reference: "+"
};

export const LOOSE_FIELD_KEYS: {
	[key: string]: string;
} = {
	"\u007E Similar to": "similarTo",
	"# Classified under": "classifiedUnder",
	"\u00A7 Classified into": "classifiedInto",
	"\u2190 Derived from": "derivedFrom",
	"\u2192 Derived into": "derivedInto",
	"\u25AB Tantamount to": "tantamountTo",
	"\u00D7 Different from": "differentFrom",
	"+ ": "reference"
};

export const LOOSE_FIELD_STRINGS: {
	[key: string]: string;
} = {
	similarTo: "\u007E Similar to",
	classifiedUnder: "# Classified under",
	classifiedInto: "# Classified into",
	derivedFrom: "\u2190 Derived from",
	derivedInto: "\u2192 Derived into",
	tantamountTo: "\u25AB Tantamount to",
	differentFrom: "\u00D7 Different from",
	"+ ": "reference"
};
