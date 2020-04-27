import fs from "fs";
import WordToJsonConverter from "../db/WordToJsonConverter";

describe("WordToJsonConverter", () => {
	describe("Constructor", () => {
		let engConverter: WordToJsonConverter;
		let spaConverter: WordToJsonConverter;

		beforeAll(() => {
			engConverter = new WordToJsonConverter("English");
			spaConverter = new WordToJsonConverter("Spanish");
		});

		test("If 'English' or 'Spanish' is provided, converter's language is set accordingly", () => {
			expect(engConverter.language).toBe("English");
			expect(spaConverter.language).toBe("Spanish");
		});

		test("If 'English' or 'Spanish' is provided, converter's filepath is set per env var", () => {
			expect(engConverter.filepath).toBe(process.env.DOCX_PATH_ENGLISH);
			expect(spaConverter.filepath).toBe(process.env.DOCX_PATH_SPANISH);
		});

		test("If filepath is not set in env var, error is thrown", () => {
			process.env.DOCX_PATH_ENGLISH = undefined;
			process.env.DOCX_PATH_SPANISH = undefined;
			expect(() => new WordToJsonConverter("English")).toThrow();
			expect(() => new WordToJsonConverter("Spanish")).toThrow();
		});

		test("If the filepath set in env var is wrong, error is thrown", () => {
			process.env.DOCX_PATH_ENGLISH = "./this/is/a/non/existing/path";
			process.env.DOCX_PATH_SPANISH = "./this/is/a/non/existing/path";
			expect(() => new WordToJsonConverter("English")).toThrow();
			expect(() => new WordToJsonConverter("Spanish")).toThrow();
		});
	});

	describe("Conversion", () => {
		test("IMPORTANT: Converts all-variant DOCX entry according to JSON sample", async () => {
			process.env.DOCX_PATH_SPANISH = "db/docx/all_variants_unit.docx";

			// Hard-coded values because it is a fixed sample entry with variants of all fields.
			// While the entry is in Spanish, it is functionally equivalent for both languages.
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
				reference: ["Referencia. [Fuente]", "Otra referencia. [Otra fuente]"],
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

			// delete all-variant unit
			fs.unlink(path, error => {
				expect(() => fs.readFileSync(path)).toThrow(); // anon func to enable `path` arg
			});
		});
	});
});
