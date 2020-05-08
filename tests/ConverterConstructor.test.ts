import fs from "fs";
import { promisify } from "util";
import WordToJsonConverter from "../conversion/WordToJsonConverter";

describe("Converter", () => {
	describe("Constructor", () => {
		const rename = promisify(fs.rename);

		test("should fail when the dotenv file does not exist", async () => {
			await rename(".env", "conversion/.env"); // put elsewhere

			expect(() => new WordToJsonConverter("English")).toThrow();

			await rename("conversion/.env", ".env"); // put back
		});

		test("should fail when the dotenv file has no DOCX file path", async () => {
			const writeFile = promisify(fs.writeFile);
			const deleteFile = promisify(fs.unlink);

			await rename(".env", "conversion/.env"); // put elsewhere
			await writeFile(".env", ""); // create empty

			expect(() => new WordToJsonConverter("English")).toThrow();

			await deleteFile(".env"); // delete empty
			await rename("conversion/.env", ".env"); // put back
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

			process.env.DOCX_PATH_ENGLISH = "conversion/docx/sample_eng.docx"; // fix
			process.env.DOCX_PATH_SPANISH = "conversion/docx/sample_spa.docx"; // fix
		});
	});
});
