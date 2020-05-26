import chalk from "chalk";
import cheerio from "cheerio";
import { LOOSE_FIELD_STRINGS } from "../utils/constants";
import DocxParser from "./DocxParser";
import JsonHelper from "./JsonHelper";

/** Responsible for logging steps and results of service operations.*/
export default class TerminalLogger {
	public language: AvailableLanguages; // only for `logEntry` and `showStats`
	public dbName?: string;
	public collectionName?: string;

	constructor(language: AvailableLanguages) {
		this.language = language;
	}

	static highlight(message: string, color: string) {
		console.log(chalk.keyword(color).inverse(message + "\n"));
	}

	static info(message: string) {
		this.highlight(message, "cyan");
	}

	static success(message: string) {
		this.highlight(message, "green");
	}

	static failure(message: string) {
		this.highlight(message, "red");
	}

	static savingJson({
		counter,
		total,
		term
	}: {
		counter: number;
		total: number;
		term: string;
	}) {
		const progressPercentage =
			((counter * 100) / total).toFixed(1).toString() + "%";

		const displayTerm = term.length < 40 ? term : term.slice(0, 40) + "...";

		console.log(
			displayTerm +
				counter.toString().padStart(50 - displayTerm.length) +
				progressPercentage.padStart(10)
		);
	}

	public uploadedAll() {
		console.log(
			`Uploaded summary and all entries to ${
				this.dbName
			} collection ${chalk.bold(this.collectionName)}`
		);
	}

	public uploadedOne(term: string) {
		console.log(
			`Uploaded ${chalk.bold(term)} to ${this.dbName} collection ${chalk.bold(
				this.collectionName
			)}`
		);
	}

	public deletedOne(term: string) {
		console.log(
			`Deleted ${chalk.bold(term)} from ${this.dbName} collection ${chalk.bold(
				this.collectionName
			)}`
		);
	}

	public deletedAllEntries() {
		console.log(
			`Deleted all entries from ${this.dbName} collection ${chalk.bold(
				this.collectionName
			)}`
		);
	}

	/**Retrieves an entry and logs it to the console.*/
	public logEntry(targetTerm: string) {
		const jsonHelper = new JsonHelper(this.language);

		const { allEntries } = jsonHelper.getBigObjectFromSingleJsonFile();

		const entryObject = allEntries.find(
			entryObject => entryObject.term === targetTerm
		);

		if (entryObject === undefined)
			throw Error("No entry found for term: " + targetTerm);

		// log main fields
		console.log(
			"\n" +
				chalk.keyword("white").inverse(entryObject.term) +
				" --- " +
				chalk.keyword("green").inverse(entryObject.translation)
		);
		if (entryObject.definition !== undefined) {
			console.log(chalk.keyword("blue").inverse(entryObject.definition));
		}
		if (entryObject.note !== undefined) {
			console.log(chalk.green(entryObject.note));
		}

		// log `similarTo`, separated from other basic link fields because of `similarTo` goes first
		if (entryObject.similarTo !== undefined) {
			console.log(
				chalk.magenta(
					LOOSE_FIELD_STRINGS.similarTo +
						": " +
						entryObject.similarTo.join(" | ")
				)
			);
		}

		// log complex link fields
		const complexLinkFields = ["classifiedUnder", "classifiedInto"];
		for (let field of complexLinkFields) {
			if (entryObject[field] !== undefined) {
				for (let line of entryObject[field] as { contents: string[] }[]) {
					console.log(
						chalk.magenta(
							LOOSE_FIELD_STRINGS[field] + ": " + line.contents.join(" | ")
						)
					);
				}
			}
		}

		// log basic link fields minus `similarTo` because `similarTo` was already logged above
		const basicLinkFieldsMinusSimilarTo = [
			"tantamountTo",
			"differentFrom",
			"derivedFrom",
			"derivedInto"
		];
		for (let field of basicLinkFieldsMinusSimilarTo) {
			if (entryObject[field] !== undefined) {
				console.log(
					chalk.magenta(
						LOOSE_FIELD_STRINGS[field] +
							": " +
							(entryObject[field] as string[]).join(" | ")
					)
				);
			}
		}

		if (entryObject.reference !== undefined) {
			for (let line of entryObject.reference) {
				console.log("+ " + line);
			}
		}
	}

	/**Logs to the terminal the number of entries for a given language. */
	public async showStats(language: AvailableLanguages) {
		const parser = new DocxParser(language);
		await parser.convertDocxToHtml();

		const $ = cheerio.load(parser.htmlString);
		const cheerioResult = $("p");

		console.log(
			`Number of DOCX/HTML entries in ${parser.language}: ${cheerioResult.length}`
		);
	}
}
