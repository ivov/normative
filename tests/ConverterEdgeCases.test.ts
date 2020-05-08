import WordToJsonConverter from "../conversion/WordToJsonConverter";

describe("Converter", () => {
	describe("Conversion process", () => {
		test("should detect duplicates", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"tests/testDocx/eng_duplicates.docx"
			);
			await myConverter.convertDocxToHtml();
			expect(() =>
				myConverter.convertHtmlToJson({ toMultipleJsonFiles: true })
			).toThrow();
		});

		test("should detect a non-entry", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"tests/testDocx/eng_not_an_entry.docx"
			);
			await myConverter.convertDocxToHtml();
			expect(() =>
				myConverter.convertHtmlToJson({ toMultipleJsonFiles: true })
			).toThrow();
		});

		test("should detect an entry without a term", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"tests/testDocx/eng_no_term.docx"
			);
			await myConverter.convertDocxToHtml();
			expect(() =>
				myConverter.convertHtmlToJson({ toMultipleJsonFiles: true })
			).toThrow();
		});

		test("should detect an entry without a translation", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"tests/testDocx/eng_no_translation.docx"
			);
			await myConverter.convertDocxToHtml();
			expect(() =>
				myConverter.convertHtmlToJson({ toMultipleJsonFiles: true })
			).toThrow();
		});

		test("should fail with badly formatted loose snippets", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"tests/testDocx/eng_bad_loose_snippets.docx"
			);
			await myConverter.convertDocxToHtml();
			expect(() =>
				myConverter.convertHtmlToJson({ toMultipleJsonFiles: true })
			).toThrow();
		});

		test("should show Mammoth messages in case of odd styling", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"tests/testDocx/eng_mammoth_messages.docx"
			);
			expect(myConverter.convertDocxToHtml()).rejects.toThrow(); // `rejects` because `convertDocxToHtml` is async
		});

		test("should fail with a styled line break", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"tests/testDocx/eng_styled_line_break.docx"
			);
			await myConverter.convertDocxToHtml();
			expect(() =>
				myConverter.convertHtmlToJson({ toMultipleJsonFiles: true })
			).toThrow();
		});
	});
});
