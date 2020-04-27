import faker from "faker";
import fs from "fs";
import JsonManager from "../db/JsonManager";
import Entry from "../db/Entry";

describe("JsonManager", () => {
	describe("JSON files", () => {
		test("Get all JSON filenames", async () => {
			const filenames = await JsonManager.getAllJsonFilenames("English");
			for (let filename of filenames) {
				expect(filename).toContain(".json");
			}
		});

		test("Save entry as JSON file and delete JSON file", () => {
			const entry = new Entry(faker.lorem.word(), faker.lorem.word());
			JsonManager.saveEntryAsJson("English", entry);
			const path = `db/json/English/${entry.slug}.json`;
			expect(fs.readFileSync(path)).not.toBeUndefined();

			fs.unlink(path, error => {
				expect(() => fs.readFileSync(path)).toThrow(); // anon func to enable `path` arg
			});
		});
	});

	describe("Summary of entries", () => {
		test("Summary of entries is `string[]`", () => {
			const summary = JsonManager.getSummaryOfEntries("English");
			expect(summary).toBeInstanceOf(Array);
			for (let entry of summary) {
				expect(typeof entry).toBe("string");
			}
		});
	});

	describe("Convert random JSON file to entry", () => {
		let entry: Entry;

		beforeAll(() => {
			const summary = JsonManager.getSummaryOfEntries("English");
			const randomJsonFile =
				summary[Math.floor(Math.random() * summary.length)];
			entry = JsonManager.convertJsonToEntry(
				"English",
				randomJsonFile + ".json"
			);
		});

		test("Entry's term, translation and slug exist and are strings", () => {
			expect(entry).toHaveProperty("term");
			expect(entry).toHaveProperty("translation");
			expect(entry).toHaveProperty("slug");
			expect(typeof entry.term).toBe("string");
			expect(typeof entry.translation).toBe("string");
			expect(typeof entry.slug).toBe("string");
		});

		test("Entry's definition and note (if any) are strings", () => {
			const definitionAndNote = [entry.definition, entry.note];

			for (let field of definitionAndNote) {
				if (field !== undefined) {
					expect(typeof field).toBe("string");
				}
			}
		});

		test("Entry's basic link fields (if any) are `string[]`", () => {
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
				}
			}
		});

		test("Entry's complex link fields (if any) are `{ contents: string[] }[]`", () => {
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
	});
});
