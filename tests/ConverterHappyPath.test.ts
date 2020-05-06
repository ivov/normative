import fs from "fs";
import cheerio from "cheerio";
import WordToJsonConverter from "../data/WordToJsonConverter";
import { promisify } from "util";
import JsonHelper from "../data/JsonHelper";
import Entry from "../data/Entry";
import Summary from "../data/Summary";
import allVariantResult from "./allVariantResult";

describe("Converter", () => {
	describe("Conversion process", () => {
		test("should properly convert the all-variant DOCX entry", async () => {
			const myConverter = new WordToJsonConverter(
				"Spanish",
				"data/docx/testing/all_variants_unit.docx"
			);

			await myConverter.convertDocxToHtml();
			myConverter.convertHtmlToJson({ multipleJsonFiles: true });

			const pathToAllVariantEntry = `data/json/Spanish/aaa.json`;
			const data = fs.readFileSync(pathToAllVariantEntry);
			const object = JSON.parse(data.toString());

			expect(data).not.toBeUndefined();
			expect(object).toEqual(allVariantResult);

			const deleteFile = promisify(fs.unlink);
			deleteFile(pathToAllVariantEntry); // cleanup
		});

		test("should produce JSON files larger than 0 bytes", async () => {
			// clear dir
			const jsonHelper = new JsonHelper("English");
			const existingFilenames = await jsonHelper.getAllJsonFilenames();
			if (existingFilenames.length > 0) jsonHelper.deleteAllJsonFiles();

			// populate dir
			const myConverter = new WordToJsonConverter("English");
			await myConverter.convertDocxToHtml();
			myConverter.convertHtmlToJson({ multipleJsonFiles: true });

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

			const converter = new WordToJsonConverter("English");

			const getCheerioResult = async () => {
				await converter.convertDocxToHtml();
				const $ = cheerio.load(converter.htmlString);
				return Array.from($("p"));
			};

			const makeQuickSummary = (cheerioResult: CheerioElement[]) => {
				const summary = new Summary("English");
				for (let cheerioEntry of cheerioResult) {
					const entry = Entry.createFromCheerio(cheerioEntry);
					summary.addTerm(entry.term);
				}
				return summary;
			};

			const cheerioResult = await getCheerioResult();
			const summary = makeQuickSummary(cheerioResult);
			expect(cheerioResult.length).toEqual(summary.getTerms().length);
		});
	});
});
