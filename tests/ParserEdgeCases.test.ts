import DocxParser from "../services/DocxParser";

describe("Parser", () => {
	describe("Conversion process", () => {
		test("should detect duplicates", async () => {
			const parser = new DocxParser(
				"English",
				"tests/testDocx/eng_duplicates.docx"
			);
			await parser.convertDocxToHtml();
			expect(() =>
				parser.convertHtmlToJson({ toMultipleJsonFiles: true })
			).toThrow();
		});

		test("should detect a non-entry", async () => {
			const parser = new DocxParser(
				"English",
				"tests/testDocx/eng_not_an_entry.docx"
			);
			await parser.convertDocxToHtml();
			expect(() =>
				parser.convertHtmlToJson({ toMultipleJsonFiles: true })
			).toThrow();
		});

		test("should detect an entry without a term", async () => {
			const parser = new DocxParser(
				"English",
				"tests/testDocx/eng_no_term.docx"
			);
			await parser.convertDocxToHtml();
			expect(() =>
				parser.convertHtmlToJson({ toMultipleJsonFiles: true })
			).toThrow();
		});

		test("should detect an entry without a translation", async () => {
			const parser = new DocxParser(
				"English",
				"tests/testDocx/eng_no_translation.docx"
			);
			await parser.convertDocxToHtml();
			expect(() =>
				parser.convertHtmlToJson({ toMultipleJsonFiles: true })
			).toThrow();
		});

		test("should fail with badly formatted loose snippets", async () => {
			const parser = new DocxParser(
				"English",
				"tests/testDocx/eng_bad_loose_snippets.docx"
			);
			await parser.convertDocxToHtml();
			expect(() =>
				parser.convertHtmlToJson({ toMultipleJsonFiles: true })
			).toThrow();
		});

		test("should show Mammoth messages in case of odd styling", async () => {
			const parser = new DocxParser(
				"English",
				"tests/testDocx/eng_mammoth_messages.docx"
			);
			expect(parser.convertDocxToHtml()).rejects.toThrow(); // `rejects` because `convertDocxToHtml` is async
		});

		test("should fail with a styled line break", async () => {
			const parser = new DocxParser(
				"English",
				"tests/testDocx/eng_styled_line_break.docx"
			);
			await parser.convertDocxToHtml();
			expect(() =>
				parser.convertHtmlToJson({ toMultipleJsonFiles: true })
			).toThrow();
		});
	});
});
