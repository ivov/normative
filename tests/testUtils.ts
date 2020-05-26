import cheerio from "cheerio";
import DocxParser from "../services/DocxParser";
import JsonHelper from "../services/JsonHelper";
import Summary from "../db/models/Summary";
import Entry from "../db/models/Entry";

// Conversion result for single entry at `tests/all_variants_unit.docx`.
export const allVariantResult = {
	term: "aaa",
	translation: "traducción <contexto> | traducción <contexto>",
	definition: "Definición.",
	note: "Nota aclaratoria.",
	slug: "aaa",
	similarTo: ["causa judicial", "proceso judicial"],
	tantamountTo: ["escribano público"],
	differentFrom: ["requerido¹"],
	derivedFrom: ["apelación"],
	derivedInto: ["Constitución de la Nación Argentina", "excepción ejecutiva"],
	reference: [
		"Referencia. 20<sup>th</sup> [Fuente]",
		"Otra referencia. [Otra fuente]"
	],
	classifiedUnder: [{ contents: ["debate"] }],
	classifiedInto: [
		{ contents: ["acción de <i>habeas corpus</i>"] },
		{ contents: ["mandato²", "carta poder", "personalidad jurídica"] }
	]
};

export const createAndSaveSummaryFile = async () => {
	const parser = new DocxParser("English");
	await parser.convertDocxToHtml();

	const $ = cheerio.load(parser.htmlString);
	const cheerioResult = Array.from($("p"));

	const summary = new Summary("English");

	for (let cheerioEntry of cheerioResult) {
		const entry = Entry.createFromCheerio(cheerioEntry);
		summary.addTerm(entry.term);
	}

	const jsonHelper = new JsonHelper("English");
	jsonHelper.saveSummaryAsJson(summary);
};

export const getCheerioResult = async () => {
	const parser = new DocxParser("English");
	await parser.convertDocxToHtml();
	const $ = cheerio.load(parser.htmlString);
	return Array.from($("p"));
};

export const createSummaryFromCheerio = (cheerioResult: CheerioElement[]) => {
	const summary = new Summary("English");
	for (let cheerioEntry of cheerioResult) {
		const entry = Entry.createFromCheerio(cheerioEntry);
		summary.addTerm(entry.term);
	}
	return summary;
};

export const createAllEntriesJsonFile = async () => {
	const parser = new DocxParser("English");
	await parser.convertDocxToHtml();
	parser.convertHtmlToJson({ toSingleJsonFile: true });
};

export const createAgreementJsonFile = async () => {
	const parser = new DocxParser(
		"English",
		"tests/testDocx/eng_only_agreement.docx"
	);
	await parser.convertDocxToHtml();
	parser.convertHtmlToJson({ toMultipleJsonFiles: true });
};
