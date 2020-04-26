import fs from "fs";
import cheerio from "cheerio";
import dotenv from "dotenv";
import WordToJsonConverter from "../db/WordToJsonConverter";
import JsonManager from "../db/JsonManager";

describe("Size of JSON files", () => {
	const getFileSize = (language: AvailableLanguages, filename: string) => {
		const stats = fs.statSync(`db/json/${language}/` + filename);
		return stats["size"]; // in bytes
	};

	test("English: JSON files are all larger than 0 bytes", async () => {
		const filenames = await JsonManager.getAllJsonFilenames("English");
		filenames.forEach((filename: string) => {
			const fileSize = getFileSize("English", filename);
			expect(fileSize).toBeGreaterThan(0);
		});
	});

	test("Spanish: JSON files are all larger than 0 bytes", async () => {
		const filenames = await JsonManager.getAllJsonFilenames("Spanish");
		filenames.forEach((filename: string) => {
			const fileSize = getFileSize("Spanish", filename);
			expect(fileSize).toBeGreaterThan(0);
		});
	});
});

describe("Number of JSON entries", () => {
	let engConverter: WordToJsonConverter;
	let spaConverter: WordToJsonConverter;

	beforeAll(async () => {
		dotenv.config({ path: ".test.env" });
		engConverter = new WordToJsonConverter("English");
		await engConverter.convertDocxToHtml();

		spaConverter = new WordToJsonConverter("Spanish");
		await spaConverter.convertDocxToHtml();
	});

	const getCheerioResult = async (language: AvailableLanguages) => {
		const converter = language === "English" ? engConverter : spaConverter;
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

	test("English: JSON entries are equal in number to DOCX entries", async () => {
		const cheerioResult = await getCheerioResult("English");
		const summary = makeSummary(engConverter, cheerioResult);
		console.log(summary.length);
		expect(cheerioResult.length).toEqual(summary.length);
	});

	test("Spanish: JSON entries are equal in number to DOCX entries", async () => {
		const cheerioResult = await getCheerioResult("Spanish");
		const summary = makeSummary(spaConverter, cheerioResult);
		expect(cheerioResult.length).toEqual(summary.length);
	});
});
