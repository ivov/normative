import fs from "fs";
import { promisify } from "util";
import DocxParser from "../services/DocxParser";

describe("Parser", () => {
	describe("Constructor", () => {
		const rename = promisify(fs.rename);

		test("should throw error when .env file does not exist", async () => {
			await rename("config/.env", ".env"); // put elsewhere

			expect(() => require("./config")).toThrow();

			await rename(".env", "config/.env"); // put back
		});

		test("should throw error when .env file has missing env vars", async () => {
			const writeFile = promisify(fs.writeFile);
			const deleteFile = promisify(fs.unlink);

			await rename("config/.env", ".env"); // put elsewhere
			await writeFile("config/.env", ""); // create empty

			expect(() => require("./config")).toThrow();

			await deleteFile("config/.env"); // delete empty
			await rename(".env", "config/.env"); // put back
		});

		test("should throw error when filepath in env var does not exist", () => {
			process.env.DOCX_PATH_ENGLISH = "this/is/a/non/existing/path"; // break
			process.env.DOCX_PATH_SPANISH = "this/is/a/non/existing/path"; // break

			expect(() => require("./config")).toThrow();

			process.env.DOCX_PATH_ENGLISH = "db/data/docx/sample_eng.docx"; // fix
			process.env.DOCX_PATH_SPANISH = "db/data/docx/sample_spa.docx"; // fix
		});

		test("should set the language per arg and filepath per env var", () => {
			const engParser = new DocxParser("English");
			const spaParser = new DocxParser("Spanish");

			expect(engParser.language).toBe("English");
			expect(spaParser.language).toBe("Spanish");

			expect(engParser.filepath).toBe(process.env.DOCX_PATH_ENGLISH);
			expect(spaParser.filepath).toBe(process.env.DOCX_PATH_SPANISH);
		});
	});
});
