import { MongoClient, Db, Collection } from "mongodb";
import dbLogger from "./dbLogger";
import JsonManager from "./JsonManager";

export default class MongoManager {
	private db: Db;
	private language: AvailableLanguages;
	private collection: Collection;

	constructor(language: AvailableLanguages) {
		this.language = language;
	}

	public async init() {
		const client = new MongoClient("mongodb://localhost:27017", {
			useNewUrlParser: true,
			useUnifiedTopology: true
		});

		await client.connect();
		this.db = client.db("normative");
		this.collection =
			this.language === "English"
				? this.db.collection("EnglishEntries")
				: this.db.collection("SpanishEntries");
	}

	private setUniqueIndex() {
		this.collection.createIndex("term", { unique: true });
	}

	public async uploadJsonEntry(jsonFilename: string) {
		const parsedObject = JsonManager.parseJsonIntoObject(
			this.language,
			jsonFilename
		);

		await this.collection.insertOne(parsedObject);
		dbLogger.uploadedEntryToMongo(parsedObject.term, this.collection.namespace);
	}

	public async uploadAllJsonEntries() {
		const filenames = await JsonManager.getAllJsonFilenames(this.language);
		for (let filename of filenames) {
			await this.uploadJsonEntry(filename);
		}
	}

	public async uploadJsonSummary() {
		const jsonFilename =
			this.language === "English"
				? "!allEntriesInEnglish.json"
				: "!allEntriesInSpanish.json";

		const parsedObject = JsonManager.parseJsonIntoObject(
			this.language,
			jsonFilename
		);

		await this.collection.insertOne(parsedObject);
		dbLogger.uploadedEntryToMongo(
			`Summary of ${this.language} entries`,
			this.collection.namespace
		);
	}

	public async getEntryDocument() {
		return await this.collection.findOne({ term: "agreement" });
	}

	public async getAllEntryDocuments() {
		return await this.collection.find({}).toArray();
	}

	public async getSummaryDocument() {
		return await this.collection.findOne({ summary: { $exists: true } });
	}
}
