import path from "path";
import fs from "fs";
import chalk from "chalk";
import cheerio from "cheerio";
import { LOOSE_FIELD_STRINGS } from "../utils/constants";
import WordToJsonConverter from "../conversion/WordToJsonConverter";

/** Responsible for logging operations in `WordToJsonConverter`, `MongoDB`, and `FirestoreDB`.*/
export default class Logger {
	public language: AvailableLanguages;
	public dbName: string; // optionally set by DB during init
	public collectionName: string; // optionally set by DB during init

	constructor(language: AvailableLanguages) {
		this.language = language;
	}

	public highlight(message: string, color: string) {
		console.log(chalk.keyword(color).inverse(message + "\n"));
	}

	public savingJson({
		counter,
		total,
		term
	}: {
		counter: number;
		total: number;
		term: string;
	}) {
		const progress = ((counter * 100) / total).toFixed(1).toString() + "%";
		let displayTerm = term.length < 40 ? term : term.slice(0, 40) + "...";
		console.log(
			displayTerm +
				counter.toString().padStart(50 - displayTerm.length) +
				progress.padStart(10)
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

	public logEntry(filename: string) {
		const sourcePath = path.join("conversion", "json", this.language, filename);
		const object = JSON.parse(fs.readFileSync(sourcePath).toString());

		// main fields
		console.log(
			"\n" +
				chalk.keyword("white").inverse(object.term) +
				" --- " +
				chalk.keyword("green").inverse(object.translation)
		);
		if (object.definition !== undefined) {
			console.log(chalk.keyword("blue").inverse(object.definition));
		}
		if (object.note !== undefined) {
			console.log(chalk.green(object.note));
		}

		// `similarTo`, separated from other basic link fields because of `similarTo` goes first
		if (object.similarTo !== undefined) {
			console.log(
				chalk.magenta(
					LOOSE_FIELD_STRINGS.similarTo + ": " + object.similarTo.join(" | ")
				)
			);
		}

		// complex link fields
		const complexLinkFields = ["classifiedUnder", "classifiedInto"];
		for (let field of complexLinkFields) {
			if (object[field] !== undefined) {
				for (let line of object[field] as { contents: string[] }[]) {
					console.log(
						chalk.magenta(
							LOOSE_FIELD_STRINGS[field] + ": " + line.contents.join(" | ")
						)
					);
				}
			}
		}

		// basic link fields minus similarTo because of order
		const basicLinkFieldsMinusSimilarTo = [
			"tantamountTo",
			"differentFrom",
			"derivedFrom",
			"derivedInto"
		];
		for (let field of basicLinkFieldsMinusSimilarTo) {
			if (object[field] !== undefined) {
				console.log(
					chalk.magenta(
						LOOSE_FIELD_STRINGS[field] +
							": " +
							(object[field] as string[]).join(" | ")
					)
				);
			}
		}

		if (object.reference !== undefined) {
			for (let line of object.reference) {
				console.log("+ " + line);
			}
		}
	}

	/**Logs to the terminal the number of entries for a given language. */
	public async showStats(language: AvailableLanguages) {
		const converter = new WordToJsonConverter(language);
		await converter.convertDocxToHtml();

		const $ = cheerio.load(converter.htmlString);
		const cheerioResult = $("p");

		this.highlight(
			`Number of DOC/HTML entries in ${converter.language}: ${cheerioResult.length}`,
			"green"
		);
	}
}
