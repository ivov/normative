import faker from "faker";
import Entry from "../db/Entry";
import JsonManager from "../db/JsonManager";

describe("Entry", () => {
	describe("Constructor", () => {
		let term: string;
		let translation: string;

		beforeAll(() => {
			term = faker.lorem.word();
			translation = faker.lorem.word();
		});

		test("2 required arguments >>> 2 properties", () => {
			const entry = new Entry(term, translation);
			expect(entry.term).toBe(term);
			expect(entry.translation).toBe(translation);
			expect(entry.definition).toBeUndefined();
			expect(entry.note).toBeUndefined();
		});

		test("2 required arguments and 2 non-empty arguments >>> 4 properties", () => {
			const entry = new Entry(
				term,
				translation,
				faker.lorem.word(),
				faker.lorem.word()
			);
			expect(entry.term).toBe(term);
			expect(entry.translation).toBe(translation);
			expect(entry.definition).toBe(entry.definition);
			expect(entry.note).toBe(entry.note);
		});

		test("Empty strings as `definition` and `note` >>> no properties", () => {
			const entry = new Entry(term, translation, "", "");
			expect(entry.term).toBe(term);
			expect(entry.translation).toBe(translation);
			expect(entry.definition).toBeUndefined();
			expect(entry.note).toBeUndefined();
		});

		test("`•` in `definition` >>> no `•` in definition", () => {
			const definition = "• This is a definition.";
			const entry = new Entry(term, translation, definition);
			expect(entry.definition).not.toContain("•");
		});

		test("`»` in `note` >>> no `»` in note", () => {
			const note = "» This is a note.";
			const entry = new Entry(term, translation, "", note);
			expect(entry.note).not.toContain("»");
		});
	});

	describe("Slug", () => {
		test("Slug: Disallowed characters removed", () => {
			const entry = new Entry(
				"<i>sine : q/ua - non</i>",
				"This is a translation"
			);
			expect(entry.slug).not.toMatch(/<i>|<\/i>|\.|:|\//);
		});

		test("Slug: Encoded apostrophe decoded", () => {
			const entry = new Entry("ben &apos; jerry", "This is a translation");
			expect(entry.slug).not.toContain("&apos;");
			expect(entry.slug).toContain("'");
		});

		test("Slug: Superscript last number as normal number", () => {
			const entry = new Entry("hello³", "This is a translation");
			expect(entry.slug).toBe("hello3");
		});
	});

	describe("Creation from object parsed from JSON", () => {
		let entry: Entry;

		beforeAll(() => {
			const summary = JsonManager.retrieveSummaryOfEntries("English");
			const randomJsonFile =
				summary[Math.floor(Math.random() * summary.length)];
			const parsedObject = JsonManager.retrieveEntryAsParsedObject(
				"English",
				randomJsonFile + ".json"
			);
			entry = Entry.createFromParsedObject(parsedObject);
		});

		test("Entry has term, translation and slug", () => {
			expect(entry).toHaveProperty("term");
			expect(entry).toHaveProperty("translation");
			expect(entry).toHaveProperty("slug");
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
