import { MongoClient, Db, Collection } from "mongodb";
import DbLogger from "./DbLogger";
import JsonHelper from "./JsonHelper";

export default class MongoManager {
	private client: MongoClient;
	private db: Db;
	private language: AvailableLanguages;
	private collection: Collection; // active collection based on `this.language`
	private dbLogger: DbLogger;

	constructor(language: AvailableLanguages) {
		this.language = language;
		this.dbLogger =
			language === "English"
				? new DbLogger("English")
				: new DbLogger("Spanish");
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

	/**Set a unique index on the active collection to prevent duplicate terms.*/
	private setUniqueIndex() {
		// to be set only once per collection
		this.collection.createIndex("term", { unique: true });
	}

	public async uploadJsonEntry(filename: string) {
		const jsonHelper = new JsonHelper(this.language);
		const object = jsonHelper.parseJsonIntoObject(filename);

		try {
			await this.collection.insertOne(object);
		} catch (error) {
			const { name, code, keyValue } = error;
			const { term } = keyValue;
			if (name === "MongoError" && code === 11000)
				throw Error(`MongoDB cannot accept duplicate term: ${term}`);
		}

		this.dbLogger.uploadedEntry({
			term: object.term,
			collection: this.collection.namespace,
			db: "MongoDB"
		});
	}

	public async uploadAllJsonEntries() {
		const jsonHelper = new JsonHelper(this.language);
		const filenames = await jsonHelper.getAllJsonFilenames();

		for (let filename of filenames) {
			await this.uploadJsonEntry(filename);
		}
	}

	public async uploadJsonSummary() {
		const filename =
			this.language === "English"
				? "!summaryEnglish.json"
				: "!summarySpanish.json";

		const jsonHelper = new JsonHelper(this.language);
		const object = jsonHelper.parseJsonIntoObject(filename);

		await this.collection.insertOne(object);

		this.dbLogger.uploadedEntry({
			term: object.term, // "!summaryEnglish" or "!summarySpanish"
			collection: this.collection.namespace,
			db: "MongoDB"
		});
	}

	public async getEntryDocument() {
		return await this.collection.findOne({ term: "agreement" });
	}

	public async getAllEntryDocuments() {
		return await this.collection.find({}).toArray();
	}

	public async getSummaryDocument() {
		const specialTerm =
			this.language === "English" ? "!summaryEnglish" : "!summarySpanish";

		return await this.collection.findOne({ term: specialTerm });
	}
}
