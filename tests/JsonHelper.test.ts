import fs from "fs";
import { promisify } from "util";
import JsonHelper from "../utils/JsonHelper";
import Summary from "../db/models/Summary";
import {
	createAndSaveSummaryFile,
	createAllEntriesJsonFile,
	createAgreementJsonFile
} from "./testUtils";
import Entry from "../db/models/Entry";

describe("JsonHelper", () => {
	const jsonHelper = new JsonHelper("English");

	test("should get all the JSON filenames", async () => {
		const filenames = await jsonHelper.getAllJsonFilenames();
		for (let filename of filenames) {
			expect(filename).toContain(".json");
		}
	});

	test("should get a summary of entries", async () => {
		await createAndSaveSummaryFile();
		const summary = jsonHelper.getSummary();

		expect(summary).toBeInstanceOf(Summary);
		for (let term of summary.getTerms()) {
			expect(typeof term).toBe("string");
		}
	});

	test("should fail at getting the summary of entries if it does not exist", async () => {
		const summaryPath = "conversion/json/English/!summaryEnglish.json";

		if (fs.existsSync(summaryPath)) {
			const rename = promisify(fs.rename);
			await rename(
				"conversion/json/English/!summaryEnglish.json",
				"conversion/json/!summaryEnglish.json"
			); // put elsewhere

			expect(() => jsonHelper.getSummary()).toThrow();

			await rename(
				"conversion/json/!summaryEnglish.json",
				"conversion/json/English/!summaryEnglish.json"
			); // put back
		}
	});

	describe("should convert a JSON file into an entry", () => {
		const agreementPath = `conversion/json/English/agreement.json`;

		if (fs.existsSync(agreementPath)) {
			const entry = jsonHelper.convertJsonToEntry("agreement.json");

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
		}
	});

	test("should get a big object from the all entries JSON file", async () => {
		await createAllEntriesJsonFile();
		const jsonHelper = new JsonHelper("English");
		const bigObject = jsonHelper.getBigObjectFromSingleJsonFile();

		expect(bigObject).toHaveProperty("allEntries");
		expect(bigObject["allEntries"]).toBeInstanceOf(Array);
	});

	test("should convert a JSON file to an object", async () => {
		await createAgreementJsonFile();
		const object = jsonHelper.convertJsonToObject("agreement.json");

		expect(object).toHaveProperty("term");
		expect(object["term"]).toBe("agreement");
	});

	test("should convert a JSON file to an entry", async () => {
		await createAgreementJsonFile();
		const entry = jsonHelper.convertJsonToEntry("agreement.json");

		expect(entry).toBeInstanceOf(Entry);
	});
});
