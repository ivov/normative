import { MongoClient, Db, Collection } from "mongodb";
import Logger from "../logs/Logger";
import JsonHelper from "../utils/JsonHelper";
import DB from "./DB.interface";

export default class MongoDB implements DB {
	private language: AvailableLanguages;
	private logger: Logger;
	private jsonHelper: JsonHelper;

	private client: MongoClient;
	private db: Db;
	private collection: Collection;

	constructor(language: AvailableLanguages) {
		this.language = language;

		this.logger =
			language === "English" ? new Logger("English") : new Logger("Spanish");

		this.jsonHelper =
			language === "English"
				? new JsonHelper("English")
				: new JsonHelper("Spanish");
	}

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

	getCollectionName(): string {
		return this.collection.namespace;
	}

	/**Sets a unique index on the active collection to prevent duplicate terms. Used only once per collection.*/
	private async setUniqueIndex() {
		await this.collection.createIndex("term", { unique: true });
		this.logger.fullGreen("Set unique index to: " + this.getCollectionName());
	}

	public async uploadAll(options: {
		fromSingleJsonFile?: boolean;
		fromMultipleJsonFiles?: boolean;
	}) {
		options.fromSingleJsonFile
			? await this.fromSingleFile()
			: await this.fromMultipleFiles();
	}

	private async fromSingleFile() {
		const allEntriesObject = this.jsonHelper.getBigObjectFromSingleJsonFile();

		for (let entryObject of allEntriesObject.allEntries) {
			await this.collection.insertOne(entryObject);

			this.logger.uploadedOne({
				term: entryObject.term,
				collection: this.getCollectionName(),
				db: "MongoDB"
			});
		}

		this.uploadSummary();
	}

	private async fromMultipleFiles() {
		const filenames = await this.jsonHelper.getAllJsonFilenames();

		for (let filename of filenames) {
			const object = this.jsonHelper.convertJsonToObject(filename);

			try {
				await this.collection.insertOne(object);
			} catch (error) {
				const { name, code, keyValue } = error;
				const { term } = keyValue;
				if (name === "MongoError" && code === 11000)
					throw Error("MongoDB cannot accept duplicate term: " + term);
			}

			this.logger.uploadedOne({
				term: object.term,
				collection: this.getCollectionName(),
				db: "MongoDB"
			});
		}

		this.logger.uploadedAll({
			collection: this.getCollectionName(),
			db: "MongoDB"
		});
	}

	public async uploadSummary() {
		const filename =
			this.language === "English"
				? "!summaryEnglish.json"
				: "!summarySpanish.json";

		const summaryObject = this.jsonHelper.convertJsonToObject(filename);

		await this.collection.insertOne(summaryObject);

		this.logger.uploadedOne({
			term: summaryObject.term, // "!summaryEnglish" or "!summarySpanish"
			collection: this.getCollectionName(),
			db: "MongoDB"
		});
	}

	public async getEntry(targetTerm: string) {
		return await this.collection.findOne({ term: targetTerm });
	}

	public async getAll() {
		return await this.collection.find({}).toArray();
	}

	public async getSummary() {
		const summaryTerm =
			this.language === "English" ? "!summaryEnglish" : "!summarySpanish";
		return await this.collection.findOne({ term: summaryTerm });
	}

	public async deleteAll() {
		await this.collection.deleteMany({});
		this.logger.deletedAllEntries({
			collection: this.getCollectionName(),
			db: "MongoDB"
		});
	}

	public async deleteEntry(targetTerm: string) {
		await this.collection.deleteOne({ term: targetTerm });

		this.logger.deletedEntry({
			term: targetTerm,
			collection: this.getCollectionName(),
			db: "MongoDB"
		});
	}

	public async deleteSummary() {
		const summaryTerm =
			this.language === "English" ? "!summaryEnglish" : "!summarySpanish";

		await this.collection.deleteOne({ term: summaryTerm });

		this.logger.deletedEntry({
			term: summaryTerm,
			collection: this.getCollectionName(),
			db: "MongoDB"
		});
	}
}
