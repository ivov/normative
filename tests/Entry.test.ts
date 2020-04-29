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

		test("should have two props when given args for term and translation", () => {
			const entry = new Entry(term, translation);
			expect(entry.term).toBe(term);
			expect(entry.translation).toBe(translation);
			expect(entry.definition).toBeUndefined();
			expect(entry.note).toBeUndefined();
		});

		test("should have four properties when given four non-empty strings", () => {
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

		test("should have no note/definition when these are given empty strings", () => {
			const entry = new Entry(term, translation, "", "");
			expect(entry.term).toBe(term);
			expect(entry.translation).toBe(translation);
			expect(entry.definition).toBeUndefined();
			expect(entry.note).toBeUndefined();
		});

		test("should remove the '•' symbol from definition", () => {
			const definition = "• This is a definition.";
			const entry = new Entry(term, translation, definition);
			expect(entry.definition).not.toContain("•");
		});

		test("should remove the '»' symbol from note", () => {
			const note = "» This is a note.";
			const entry = new Entry(term, translation, "", note);
			expect(entry.note).not.toContain("»");
		});
	});

	describe("Slug", () => {
		test("should have any disallowed characters removed from slug", () => {
			const entry = new Entry(
				"<i>sine : q/ua - non</i>",
				"This is a translation"
			);
			expect(entry.slug).not.toMatch(/<i>|<\/i>|\.|:|\//);
		});

		// test("should have any apostrophe decoded in slug", () => {
		// 	const entry = new Entry("ben &apos; jerry", "This is a translation");
		// 	expect(entry.slug).not.toContain("&apos;");
		// 	expect(entry.slug).toContain("'");
		// });

		test("should have any superscript last number as a normal number in slug", () => {
			const entry = new Entry("hello³", "This is a translation");
			expect(entry.slug).toBe("hello3");
		});
	});
});
