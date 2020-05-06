import faker from "faker";
import fs from "fs";
import { promisify } from "util";
import JsonHelper from "../data/JsonHelper";
import Entry from "../data/Entry";
import WordToJsonConverter from "../data/WordToJsonConverter";
import Summary from "../data/Summary";

describe("JsonHelper", () => {
	const jsonHelper = new JsonHelper("English");

	test("should get all the JSON filenames", async () => {
		const filenames = await jsonHelper.getAllJsonFilenames();
		for (let filename of filenames) {
			expect(filename).toContain(".json");
		}
	});

	test("should get a summary of entries", () => {
		const path = "data/json/English/!summaryEnglish.json";

		if (fs.existsSync(path)) {
			const summary = jsonHelper.getSummary();
			expect(summary).toBeInstanceOf(Summary);
			for (let term of summary.getTerms()) {
				expect(typeof term).toBe("string");
			}
		} else {
			expect(() => jsonHelper.getSummary()).toThrow();
		}
	});

	test("should fail at getting the summary of entries if it does not exist", async () => {
		const rename = promisify(fs.rename);
		await rename(
			"data/json/English/!summaryEnglish.json",
			"data/json/!summaryEnglish.json"
		); // put elsewhere

		expect(() => jsonHelper.getSummary()).toThrow();

		await rename(
			"data/json/!summaryEnglish.json",
			"data/json/English/!summaryEnglish.json"
		); // put back
	});

	describe("Should convert a random JSON file into an entry", () => {
		const path = `data/json/English/!summaryEnglish.json`;

		if (fs.existsSync(path)) {
			let entry: Entry;

			beforeAll(() => {
				const summary = jsonHelper.getSummary();
				const summaryTerms = summary.getTerms();
				const randomTerm =
					summaryTerms[Math.floor(Math.random() * summaryTerms.length)];
				entry = jsonHelper.convertJsonToEntry(randomTerm + ".json");
			});

			test("where term, translation and slug exist and are strings", () => {
				expect(entry).toHaveProperty("term");
				expect(entry).toHaveProperty("translation");
				expect(entry).toHaveProperty("slug");
				expect(typeof entry.term).toBe("string");
				expect(typeof entry.translation).toBe("string");
				expect(typeof entry.slug).toBe("string");
			});

			test("where definition and note (if any) are strings", () => {
				const definitionAndNote = [entry.definition, entry.note];

				for (let field of definitionAndNote) {
					if (field !== undefined) {
						expect(typeof field).toBe("string");
					}
				}
			});

			test("where each basic link field (if any) is an array of strings", () => {
				const basicLinkFields = [
					entry.similarTo,
					entry.tantamountTo,
					entry.differentFrom,
					entry.derivedFrom,
					entry.derivedInto,
					entry.reference
				];

				for (let field of basicLinkFields) {
					if (field !== undefined) {
						expect(field).toBeInstanceOf(Array);
						for (let string of field) {
							expect(typeof string).toBe("string");
						}
					}
				}
			});

			test("where each complex link field (if any) is properly structured", () => {
				const complexLinkFields = [entry.classifiedUnder, entry.classifiedInto];

				for (let field of complexLinkFields) {
					if (field !== undefined) {
						expect(field).toBeInstanceOf(Array);
						expect(typeof field).toBe("object");

						for (let object of field) {
							expect(object).toHaveProperty("contents");
							expect(object["contents"]).toBeInstanceOf(Array);
							for (let string of object["contents"]) {
								expect(typeof string).toBe("string");
							}
						}
					}
				}
			});
		}
	});

	test("should delete all JSON files", async () => {
		const jsonHelper = new JsonHelper("English");
		const filenames = await jsonHelper.getAllJsonFilenames();

		if (filenames.length > 0) {
			await jsonHelper.deleteAllJsonFiles();
			const newFilenames = await jsonHelper.getAllJsonFilenames();

			expect(newFilenames.length).toBe(0);
			expect(jsonHelper.deleteAllJsonFiles()).rejects.toThrow();

			// recreate all deleted JSON files
			const converter = new WordToJsonConverter("English");
			await converter.convertDocxToHtml();
			converter.convertHtmlToJson({ multipleJsonFiles: true });
		}
	});
});
