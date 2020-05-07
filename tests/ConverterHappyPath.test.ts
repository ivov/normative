import fs from "fs";
import WordToJsonConverter from "../data/WordToJsonConverter";
import { promisify } from "util";
import JsonHelper from "../data/JsonHelper";
import {
	allVariantResult,
	getCheerioResult,
	createSummaryFromCheerio
} from "./testUtils";

describe("Converter", () => {
	describe("Conversion process", () => {
		test("should properly convert the all-variant DOCX entry", async () => {
			const myConverter = new WordToJsonConverter(
				"Spanish",
				"tests/testDocx/all_variants_unit.docx"
			);

			await myConverter.convertDocxToHtml();

			// convert twice just to test both
			myConverter.convertHtmlToJson({ toMultipleJsonFiles: true });
			myConverter.convertHtmlToJson({ toSingleJsonFile: true });

			const pathToAllVariantFile = `data/json/Spanish/aaa.json`;
			const data = fs.readFileSync(pathToAllVariantFile);
			const object = JSON.parse(data.toString());

			expect(data).not.toBeUndefined();
			expect(object).toEqual(allVariantResult);

			// cleanup
			const deleteFile = promisify(fs.unlink);
			deleteFile(pathToAllVariantFile);
		});

		test("should produce JSON files larger than 0 bytes", async () => {
			// clear dir
			const jsonHelper = new JsonHelper("English");
			const existingFilenames = await jsonHelper.getAllJsonFilenames();
			if (existingFilenames.length > 0) jsonHelper.deleteAllJsonFiles();

			// populate dir
			const myConverter = new WordToJsonConverter("English");
			await myConverter.convertDocxToHtml();
			myConverter.convertHtmlToJson({ toMultipleJsonFiles: true });

			const getFileSize = (filename: string) => {
				const stats = fs.statSync(`data/json/English/` + filename);
				return stats["size"]; // in bytes
			};

			const filenames = await jsonHelper.getAllJsonFilenames();
			filenames.forEach((filename: string) => {
				const fileSize = getFileSize(filename);
				expect(fileSize).toBeGreaterThan(0);
			});
		});

		test("should produce JSON entries equal in number to DOCX entries", async () => {
			// clear dir
			const jsonHelper = new JsonHelper("English");
			const existingFilenames = await jsonHelper.getAllJsonFilenames();
			if (existingFilenames.length > 0) jsonHelper.deleteAllJsonFiles();

			const cheerioResult = await getCheerioResult();
			const summary = createSummaryFromCheerio(cheerioResult);
			expect(cheerioResult.length).toEqual(summary.getTerms().length);
		});
	});
});
