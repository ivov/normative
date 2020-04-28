import fs from "fs";
import cheerio from "cheerio";
import dotenv from "dotenv";
import { mocked } from "ts-jest/utils";
import WordToJsonConverter from "../db/WordToJsonConverter";
import JsonManager from "../db/JsonManager";

describe("WordToJsonConverter", () => {
	let engConverter: WordToJsonConverter;
	let spaConverter: WordToJsonConverter;

	beforeAll(() => {
		engConverter = new WordToJsonConverter("English");
		spaConverter = new WordToJsonConverter("Spanish");
	});

	describe("Constructor", () => {
		// test("should fail when the dotenv file does not exist", () => {
		// 	jest.mock("fs");
		// 	const mockedFs = mocked(fs, true);
		// 	mockedFs.existsSync.mockReturnValue(false);

		// 	expect(() => new WordToJsonConverter("English")).toThrow();
		// });

		test("should set the language when given 'English' or 'Spanish'", () => {
			expect(engConverter.language).toBe("English");
			expect(spaConverter.language).toBe("Spanish");
		});

		test("should set the filepath per env var when given 'English' or 'Spanish'", () => {
			expect(engConverter.filepath).toBe(process.env.DOCX_PATH_ENGLISH);
			expect(spaConverter.filepath).toBe(process.env.DOCX_PATH_SPANISH);
		});

		test("should throw error when the filepath set in env var does not exist", () => {
			process.env.DOCX_PATH_ENGLISH = "./this/is/a/non/existing/path";
			process.env.DOCX_PATH_SPANISH = "./this/is/a/non/existing/path";

			expect(() => new WordToJsonConverter("English")).toThrow();
			expect(() => new WordToJsonConverter("Spanish")).toThrow();
		});
	});

	describe("Conversion process", () => {
		test("should detect duplicates", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"db/docx/testing/eng_duplicates.docx"
			);
			await myConverter.convertDocxToHtml();
			expect(() => myConverter.convertHtmltoJson()).toThrow();
		});

		test("should detect a non-entry", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"db/docx/testing/eng_not_an_entry.docx"
			);
			await myConverter.convertDocxToHtml();
			expect(() => myConverter.convertHtmltoJson()).toThrow();
		});

		test("should detect an entry without a term", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"db/docx/testing/eng_no_term.docx"
			);
			await myConverter.convertDocxToHtml();
			expect(() => myConverter.convertHtmltoJson()).toThrow();
		});

		test("should detect an entry without a translation", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"db/docx/testing/eng_no_translation.docx"
			);
			await myConverter.convertDocxToHtml();
			expect(() => myConverter.convertHtmltoJson()).toThrow();
		});

		test("should fail with badly formatted loose snippets", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"db/docx/testing/eng_bad_loose_snippets.docx"
			);
			await myConverter.convertDocxToHtml();
			expect(() => myConverter.convertHtmltoJson()).toThrow();
		});

		test("should show Mammoth messages in case of odd styling", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"db/docx/testing/eng_mammoth_messages.docx"
			);
			expect(myConverter.convertDocxToHtml()).rejects.toThrow(); // `rejects` because `convertDocxToHtml` is async
		});

		test("should convert the all-variant DOCX entry into one that matches the JSON sample", async () => {
			process.env.DOCX_PATH_SPANISH = "db/docx/testing/all_variants_unit.docx";

			// Hard-coded values because it is a fixed sample entry with variants of all fields.
			const result = {
				term: "aaa",
				translation:
					"traducción &lt;contexto&gt; | traducción &lt;contexto&gt;",
				definition: "Definición.",
				note: "Nota aclaratoria.",
				slug: "aaa",
				similarTo: ["causa judicial", "proceso judicial"],
				tantamountTo: ["escribano público"],
				differentFrom: ["requerido¹"],
				derivedFrom: ["apelación"],
				derivedInto: [
					"Constitución de la Nación Argentina",
					"excepción ejecutiva"
				],
				reference: [
					"Referencia. 20<sup>th</sup> [Fuente]",
					"Otra referencia. [Otra fuente]"
				],
				classifiedUnder: [{ contents: ["debate"] }],
				classifiedInto: [
					{ contents: ["acción de <i>habeas corpus</i>"] },
					{ contents: ["mandato²", "carta poder", "personalidad jurídica"] }
				]
			};

			const myConverter = new WordToJsonConverter("Spanish");
			await myConverter.convertDocxToHtml();
			myConverter.convertHtmltoJson();

			const path = `db/json/Spanish/aaa.json`;
			const data = fs.readFileSync(path);
			const parsedObject = JSON.parse(data.toString());

			expect(data).not.toBeUndefined();
			expect(parsedObject).toEqual(result);

			// cleanup: delete all-variant unit
			fs.unlink(path, error => {
				if (error) expect(() => fs.readFileSync(path)).toThrow(); // anon func to enable `path` arg
			});
		});

		test("should produce JSON files larger than 0 bytes", async () => {
			const getFileSize = (language: AvailableLanguages, filename: string) => {
				const stats = fs.statSync(`db/json/${language}/` + filename);
				return stats["size"]; // in bytes
			};

			const engFilenames = await JsonManager.getAllJsonFilenames("English");
			engFilenames.forEach((filename: string) => {
				const fileSize = getFileSize("English", filename);
				expect(fileSize).toBeGreaterThan(0);
			});

			const spaFilenames = await JsonManager.getAllJsonFilenames("Spanish");
			spaFilenames.forEach((filename: string) => {
				const fileSize = getFileSize("Spanish", filename);
				expect(fileSize).toBeGreaterThan(0);
			});
		});

		test("should produce JSON entries equal in number to DOCX entries", async () => {
			const getCheerioResult = async (language: AvailableLanguages) => {
				const converter = language === "English" ? engConverter : spaConverter;
				await converter.convertDocxToHtml();
				const $ = cheerio.load(converter.htmlString);
				return Array.from($("p"));
			};

			const makeSummary = (
				converter: WordToJsonConverter,
				cheerioResult: CheerioElement[]
			) => {
				let summaryOfEntries: string[] = [];
				for (let cheerioEntry of cheerioResult) {
					let entry = converter.createEntry(cheerioEntry);
					summaryOfEntries.push(entry.slug);
				}
				return summaryOfEntries;
			};

			const engCheerioResult = await getCheerioResult("English");
			const engSummary = makeSummary(engConverter, engCheerioResult);
			expect(engCheerioResult.length).toEqual(engSummary.length);

			const spaCheerioResult = await getCheerioResult("Spanish");
			const spaSummary = makeSummary(spaConverter, spaCheerioResult);
			expect(spaCheerioResult.length).toEqual(spaSummary.length);
		});
	});
});
