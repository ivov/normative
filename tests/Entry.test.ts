import faker from "faker";
import Entry from "../db/Entry";

describe("Entry", () => {
	describe("Constructor", () => {
		let term: string;
		let translation: string;

		beforeAll(() => {
			term = faker.lorem.word();
			translation = faker.lorem.word();
		});

		test("2 required args >>> 2 properties", () => {
			const entry = new Entry(term, translation);
			expect(entry.term).toBe(term);
			expect(entry.translation).toBe(translation);
			expect(entry.definition).toBeUndefined();
			expect(entry.note).toBeUndefined();
		});

		test("2 required args and 2 non-empty args >>> 4 properties populated", () => {
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

		test("Empty strings in definition and note >>> no definition, no note", () => {
			const entry = new Entry(term, translation, "", "");
			expect(entry.term).toBe(term);
			expect(entry.translation).toBe(translation);
			expect(entry.definition).toBeUndefined();
			expect(entry.note).toBeUndefined();
		});

		test("`•` in definition >>> symbol removed from definition", () => {
			const definition = "• This is a definition.";
			const entry = new Entry(term, translation, definition);
			expect(entry.definition).not.toContain("•");
		});

		test("`»` in `note` >>> symbol removed from note", () => {
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
});
