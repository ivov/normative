import chalk from "chalk";
import cheerio from "cheerio";
import { LOOSE_FIELD_STRINGS } from "../db/constants";
import WordToJsonConverter from "../db/WordToJsonConverter";
import JsonManager from "../db/JsonManager";
import Entry from "../db/Entry";

/** Responsible for logging messages for `WordToJsonConverter` and `FirestoreManager`. Independent method: `logEntryToTerminal`.*/
export default class TerminalLogger {
	public static logError(errorMessage: string) {
		console.log(chalk.keyword("red").inverse(errorMessage));
	}

	public static logDeletedJsonFiles(language: AvailableLanguages): void {
		console.log(
			chalk.keyword("green").inverse(`Deleted all JSON files in ${language}.\n`)
		);
	}

	public static logConvertedDocxToHtml(): void {
		console.log(
			chalk.keyword("green").inverse("Converted DOCX file to HTML string.\n")
		);
	}

	public static logConvertedHtmlToJson(entries: number): void {
		console.log(
			chalk
				.keyword("green")
				.inverse(`Converted HTML string to ${entries} JSON files.\n`)
		);
	}

	public static logJsonSavingProgress({
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

	static logSavedNumberOfEntries(
		summaryOfEntries: string[],
		language: AvailableLanguages
	) {
		console.log(
			chalk
				.keyword("green")
				.inverse(
					`\nConverted ${summaryOfEntries.length} entries in ${language} from DOCX to JSON.`
				)
		);
	}

	public static logUploadedEntries(
		language: AvailableLanguages,
		slug: string
	): void {
		console.log(
			`Uploaded to Firestore ${language} collection: ` + chalk.bold(slug)
		);
	}

	public static logUploadedSummary(language: AvailableLanguages): void {
		console.log(
			`Uploaded to Firestore Summaries collection: ` +
				chalk.bold("Summary for " + language)
		);
	}

	public logEntryToTerminal(
		language: AvailableLanguages,
		filename: string
	): void {
		const parsedObject = JsonManager.retrieveEntryAsParsedObject(
			language,
			filename
		);
		const entry = Entry.createFromParsedObject(parsedObject);

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
