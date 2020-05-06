import fs from "fs";
import cheerio from "cheerio";
import WordToJsonConverter from "../data/WordToJsonConverter";
import JsonHelper from "../data/JsonHelper";
import Entry from "../data/Entry";
import Summary from "../data/Summary";

describe("Converter", () => {
	describe("Conversion process", () => {
		test("should detect duplicates", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"data/docx/testing/eng_duplicates.docx"
			);
			await myConverter.convertDocxToHtml();
			expect(() =>
				myConverter.convertHtmlToJson({ multipleJsonFiles: true })
			).toThrow();
		});

		test("should detect a non-entry", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"data/docx/testing/eng_not_an_entry.docx"
			);
			await myConverter.convertDocxToHtml();
			expect(() =>
				myConverter.convertHtmlToJson({ multipleJsonFiles: true })
			).toThrow();
		});

		test("should detect an entry without a term", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"data/docx/testing/eng_no_term.docx"
			);
			await myConverter.convertDocxToHtml();
			expect(() =>
				myConverter.convertHtmlToJson({ multipleJsonFiles: true })
			).toThrow();
		});

		test("should detect an entry without a translation", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"data/docx/testing/eng_no_translation.docx"
			);
			await myConverter.convertDocxToHtml();
			expect(() =>
				myConverter.convertHtmlToJson({ multipleJsonFiles: true })
			).toThrow();
		});

		test("should fail with badly formatted loose snippets", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"data/docx/testing/eng_bad_loose_snippets.docx"
			);
			await myConverter.convertDocxToHtml();
			expect(() =>
				myConverter.convertHtmlToJson({ multipleJsonFiles: true })
			).toThrow();
		});

		test("should show Mammoth messages in case of odd styling", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"data/docx/testing/eng_mammoth_messages.docx"
			);
			expect(myConverter.convertDocxToHtml()).rejects.toThrow(); // `rejects` because `convertDocxToHtml` is async
		});

		test("should fail with a styled line break", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"data/docx/testing/eng_styled_line_break.docx"
			);
			await myConverter.convertDocxToHtml();
			expect(() =>
				myConverter.convertHtmlToJson({ multipleJsonFiles: true })
			).toThrow();
		});
	});
});
