import { MongoClient, Db, Collection } from "mongodb";
import DataLogger from "./DataLogger";
import JsonHelper from "./JsonHelper";

export default class MongoManager {
	private client: MongoClient;
	private db: Db;
	private language: AvailableLanguages;
	private collection: Collection;
	private dataLogger: DataLogger;

	constructor(language: AvailableLanguages) {
		this.language = language;
		this.dataLogger =
			language === "English"
				? new DataLogger("English")
				: new DataLogger("Spanish");
	}

	/** Initialize client, open connection and set `db`, `language` and `collection` references.*/
	public async init() {
		this.client = new MongoClient("mongodb://localhost:27017", {
			useNewUrlParser: true,
			useUnifiedTopology: true
		});
		await this.client.connect();

		console.log("Connected to MongoDB");

		this.db = this.client.db("normative");
		this.collection =
			this.language === "English"
				? this.db.collection("EnglishEntries")
				: this.db.collection("SpanishEntries");
	}

	public async disconnect() {
		await this.client.close();
	}

	/**Set a unique index on the active collection to prevent duplicate terms. To be set only once per collection.*/
	private async setUniqueIndex() {
		await this.collection.createIndex("term", { unique: true });
		this.dataLogger.fullGreen(
			"Set unique index to: " + this.collection.namespace
		);
	}

	public async uploadEntryFromJsonFilename(filename: string) {
		const jsonHelper = new JsonHelper(this.language);
		const object = jsonHelper.convertJsonToObject(filename);

		try {
			await this.collection.insertOne(object);
		} catch (error) {
			const { name, code, keyValue } = error;
			const { term } = keyValue;
			if (name === "MongoError" && code === 11000)
				throw Error("MongoDB cannot accept duplicate term: " + term);
		}

		this.dataLogger.uploadedEntry({
			term: object.term,
			collection: this.collection.namespace,
			db: "MongoDB"
		});
	}

	public async uploadAll(options: {
		fromSingleJsonFile?: boolean;
		fromMultipleJsonFiles?: boolean;
	}) {
		options.fromSingleJsonFile
			? await this.fromSingleFile()
			: await this.fromMultipleFiles();
	}

	private async fromMultipleFiles() {
		const jsonHelper = new JsonHelper(this.language);
		const filenames = await jsonHelper.getAllJsonFilenames();

		for (let filename of filenames) {
			await this.uploadEntryFromJsonFilename(filename);
		}

		this.dataLogger.uploadedAllEntries({
			collection: this.collection.namespace,
			db: "MongoDB"
		});
	}

	private async fromSingleFile() {
		const jsonHelper = new JsonHelper(this.language);
		const allEntriesObject = jsonHelper.getBigObjectFromSingleJsonFile();

		for (let entryObject of allEntriesObject.allEntries) {
			await this.collection.insertOne(entryObject);

			this.dataLogger.uploadedEntry({
				term: entryObject.term,
				collection: this.collection.namespace,
				db: "MongoDB"
			});
		}

		this.uploadJsonSummary();
	}

	public async uploadJsonSummary() {
		const filename =
			this.language === "English"
				? "!summaryEnglish.json"
				: "!summarySpanish.json";

		const jsonHelper = new JsonHelper(this.language);
		const object = jsonHelper.convertJsonToObject(filename);

		await this.collection.insertOne(object);

		this.dataLogger.uploadedEntry({
			term: object.term, // "!summaryEnglish" or "!summarySpanish"
			collection: this.collection.namespace,
			db: "MongoDB"
		});
	}

	public async getEntryDocument(targetTerm: string) {
		return await this.collection.findOne({ term: targetTerm });
	}

	public async getAllDocuments() {
		return await this.collection.find({}).toArray();
	}

	public async getSummaryDocument() {
		const summaryTerm =
			this.language === "English" ? "!summaryEnglish" : "!summarySpanish";

		return await this.collection.findOne({ term: summaryTerm });
	}

	public async deleteDocument(targetTerm: string) {
		await this.collection.deleteOne({ term: targetTerm });

		this.dataLogger.deletedEntry({
			term: targetTerm,
			collection: this.collection.namespace,
			db: "MongoDB"
		});
	}

	public async deleteAllDocuments() {
		await this.collection.deleteMany({});
		this.dataLogger.deletedAllEntries({
			collection: this.collection.namespace,
			db: "MongoDB"
		});
	}
}
