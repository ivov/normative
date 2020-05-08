import path from "path";
import fs from "fs";
import chalk from "chalk";
import cheerio from "cheerio";
import { LOOSE_FIELD_STRINGS } from "../utils/constants";
import WordToJsonConverter from "../conversion/WordToJsonConverter";

/** Responsible for logging messages for DB operations in `WordToJsonConverter`, `MongoManager`, and `FirestoreManager`.*/
export default class Logger {
	private language: AvailableLanguages;

	constructor(language: AvailableLanguages) {
		this.language = language;
	}

	public fullRed(errorMessage: string) {
		console.log(chalk.keyword("red").inverse(errorMessage));
	}

	public fullGreen(message: string) {
		console.log(chalk.keyword("green").inverse(message + "\n"));
	}

	public savingJson({
		counter,
		total,
		slug
	}: {
		counter: number;
		total: number;
		slug: string;
	}) {
		const progress = ((counter * 100) / total).toFixed(1).toString() + "%";
		let displaySlug = slug.length < 40 ? slug : slug.slice(0, 40) + "...";
		console.log(
			displaySlug +
				counter.toString().padStart(50 - displaySlug.length) +
				progress.padStart(10)
		);
	}

	public uploadedAllEntries({
		collection,
		db
	}: {
		collection: string;
		db: string;
	}) {
		console.log(
			`Uploaded all entries from single JSON file to ${db} collection ${chalk.bold(
				collection
			)}`
		);
	}

	public uploadedEntry({
		term,
		collection,
		db
	}: {
		term: string;
		collection: string;
		db: string;
	}) {
		console.log(
			`Uploaded ${chalk.bold(term)} to ${db} collection ${chalk.bold(
				collection
			)}`
		);
	}

	public deletedEntry({
		term,
		collection,
		db
	}: {
		term: string;
		collection: string;
		db: string;
	}) {
		console.log(
			`Deleted ${chalk.bold(term)} from ${db} collection ${chalk.bold(
				collection
			)}`
		);
	}

	public deletedAllEntries({
		collection,
		db
	}: {
		collection: string;
		db: string;
	}) {
		console.log(
			`Deleted all entries from ${db} collection ${chalk.bold(collection)}`
		);
	}

	public logEntry(filename: string) {
		const sourcePath = path.join("conversion", "json", this.language, filename);
		const object = JSON.parse(fs.readFileSync(sourcePath).toString());

		// const decodeHtml = (html: string) => { // no need to decode for now
		// 	return html
		// 		.replace(/&amp;/g, "&")
		// 		.replace(/&lt;/g, "<")
		// 		.replace(/&gt;/g, ">");
		// };

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

		// similarTo, separated from other basic link fields because of order
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

		this.fullGreen(
			`Number of DOC/HTML entries in ${converter.language}: ${cheerioResult.length}`
		);
	}
}
