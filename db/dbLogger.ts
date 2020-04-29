import fs from "fs";
import chalk from "chalk";
import cheerio from "cheerio";
import { LOOSE_FIELD_STRINGS } from "./constants";
import WordToJsonConverter from "./WordToJsonConverter";
import JsonHelper from "./JsonHelper";
import { file } from "@babel/types";

/** Responsible for logging messages for DB operations in `WordToJsonConverter`, `MongoManager`, and `FirestoreManager`.*/
export default class DbLogger {
	private language: AvailableLanguages;

	constructor(language: AvailableLanguages) {
		this.language = language;
	}

	public logError(errorMessage: string) {
		console.log(chalk.keyword("red").inverse(errorMessage));
	}

	public convertedDocxToHtml(): void {
		console.log(
			chalk.keyword("green").inverse("Converted DOCX file to HTML string.\n")
		);
	}

	public convertedHtmlToJson(numberOfEntries: number): void {
		console.log(
			chalk
				.keyword("green")
				.inverse(`Converted HTML string to ${numberOfEntries} JSON files.\n`)
		);
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

	savedJson(summaryOfEntries: string[]) {
		console.log(
			chalk
				.keyword("green")
				.inverse(
					`\nConverted ${summaryOfEntries.length} entries in ${this.language} from DOCX to JSON.`
				)
		);
	}

	public deletedAllJsonFiles() {
		console.log(
			chalk
				.keyword("green")
				.inverse(`Deleted all JSON files in ${this.language}.\n`)
		);
	}
	public uploadedToFirestore(slug: string) {
		console.log(
			`Uploaded to Firestore ${this.language} collection: ` + chalk.bold(slug)
		);
	}

	public uploadedSummaryToFirestore() {
		console.log(
			`Uploaded to Firestore Summaries collection: ` +
				chalk.bold("Summary for " + this.language)
		);
	}

	public uploadedEntryToMongo(slug: string, collection: string) {
		console.log(
			`Uploaded ${chalk.bold(slug)} to MongoDB collection ${chalk.bold(
				collection
			)}`
		);
	}

	public showFullEntry(filename: string) {
		// TODO: no need for entry?
		// const entry = this.jsonHelper.convertJsonToEntry(filename);

		const data = fs.readFileSync(`db/json/${this.language}/${filename}`);
		const entry = JSON.parse(data.toString());

		const decodeHtml = (html: string) => {
			return html
				.replace(/&amp;/g, "&")
				.replace(/&lt;/g, "<")
				.replace(/&gt;/g, ">");
		};

		// main fields
		console.log(
			"\n" +
				chalk.keyword("white").inverse(entry.term) +
				" --- " +
				chalk.keyword("green").inverse(decodeHtml(entry.translation))
		);
		if (entry.definition !== undefined) {
			console.log(chalk.keyword("blue").inverse(entry.definition));
		}
		if (entry.note !== undefined) {
			console.log(chalk.green(entry.note));
		}

		// similarTo, separated from other basic link fields because of order
		if (entry.similarTo !== undefined) {
			console.log(
				chalk.magenta(
					LOOSE_FIELD_STRINGS.similarTo + ": " + entry.similarTo.join(" | ")
				)
			);
		}

		// complex link fields
		const complexLinkFields = ["classifiedUnder", "classifiedInto"];
		for (let field of complexLinkFields) {
			if (entry[field] !== undefined) {
				for (let line of entry[field] as { contents: string[] }[]) {
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
			if (entry[field] !== undefined) {
				console.log(
					chalk.magenta(
						LOOSE_FIELD_STRINGS[field] +
							": " +
							(entry[field] as string[]).join(" | ")
					)
				);
			}
		}

		if (entry.reference !== undefined) {
			for (let line of entry.reference) {
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

		console.log(
			chalk
				.keyword("green")
				.inverse(
					`Number of DOC/HTML entries in ${converter.language}: ${cheerioResult.length}\n`
				)
		);
	}
}
