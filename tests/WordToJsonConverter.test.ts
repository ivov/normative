import fs from "fs";
import cheerio from "cheerio";
import { promisify } from "util";
import WordToJsonConverter from "../db/WordToJsonConverter";
import JsonHelper from "../db/JsonHelper";

describe("WordToJsonConverter", () => {
	describe("Constructor", () => {
		const rename = promisify(fs.rename);

		test("should fail when the dotenv file does not exist", async () => {
			await rename(".env", "db/.env"); // put elsewhere

			expect(() => new WordToJsonConverter("English")).toThrow();

			await rename("db/.env", ".env"); // put back
		});

		test("should fail when the dotenv file has no DOCX file path", async () => {
			const writeFile = promisify(fs.writeFile);
			const deleteFile = promisify(fs.unlink);

			await rename(".env", "db/.env"); // put elsewhere
			await writeFile(".env", ""); // create empty

			expect(() => new WordToJsonConverter("English")).toThrow();

			await deleteFile(".env"); // delete empty
			await rename("db/.env", ".env"); // put back
		});

		test("should set the language per arg and filepath per env var", () => {
			const engConverter = new WordToJsonConverter("English");
			const spaConverter = new WordToJsonConverter("Spanish");

			expect(engConverter.language).toBe("English");
			expect(spaConverter.language).toBe("Spanish");

			expect(engConverter.filepath).toBe(process.env.DOCX_PATH_ENGLISH);
			expect(spaConverter.filepath).toBe(process.env.DOCX_PATH_SPANISH);
		});

		test("should throw error when filepath set in env var does not exist", () => {
			process.env.DOCX_PATH_ENGLISH = "./this/is/a/non/existing/path"; // break
			process.env.DOCX_PATH_SPANISH = "./this/is/a/non/existing/path"; // break

			expect(() => new WordToJsonConverter("English")).toThrow();
			expect(() => new WordToJsonConverter("Spanish")).toThrow();

			process.env.DOCX_PATH_ENGLISH = "db/docx/sample_eng.docx"; // fix
			process.env.DOCX_PATH_SPANISH = "db/docx/sample_spa.docx"; // fix
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

		test("should fail with a styled line break", async () => {
			const myConverter = new WordToJsonConverter(
				"English",
				"db/docx/testing/eng_styled_line_break.docx"
			);
			await myConverter.convertDocxToHtml();
			expect(() => myConverter.convertHtmltoJson()).toThrow();
		});

		test("should properly convert the all-variant DOCX entry", async () => {
			process.env.DOCX_PATH_SPANISH = "db/docx/testing/all_variants_unit.docx";

			// Hard-coded values because it is a fixed sample entry with variants of all fields.
			const result = {
				term: "aaa",
				translation: "traducción <contexto> | traducción <contexto>",
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
			const object = JSON.parse(data.toString());

			expect(data).not.toBeUndefined();
			expect(object).toEqual(result);

			// delete all-variant unit
			fs.unlink(path, error => {
				if (error) expect(() => fs.readFileSync(path)).toThrow(); // anon func to enable `path` arg
			});
		});

		test("should produce JSON files larger than 0 bytes", async () => {
			const getFileSize = (filename: string) => {
				const stats = fs.statSync(`db/json/English/` + filename);
				return stats["size"]; // in bytes
			};

			const jsonHelper = new JsonHelper("English");
			const filenames = await jsonHelper.getAllJsonFilenames();
			filenames.forEach((filename: string) => {
				const fileSize = getFileSize(filename);
				expect(fileSize).toBeGreaterThan(0);
			});
		});

		test("should produce JSON entries equal in number to DOCX entries", async () => {
			const converter = new WordToJsonConverter("English");

			const getCheerioResult = async () => {
				await converter.convertDocxToHtml();
				const $ = cheerio.load(converter.htmlString);
				return Array.from($("p"));
			};

			const makeAdHocSummary = (
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

			const cheerioResult = await getCheerioResult();
			const summary = makeAdHocSummary(converter, cheerioResult);
			expect(cheerioResult.length).toEqual(summary.length);
		});
	});
});
