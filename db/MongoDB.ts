import { MongoClient, Db, Collection } from "mongodb";
import Logger from "../logs/Logger";
import JsonHelper from "../utils/JsonHelper";
import DB from "./DB.interface";
import { SUMMARY_TERM } from "../utils/constants";

export default class MongoDB implements DB {
	private language: AvailableLanguages;
	private logger: Logger;
	private jsonHelper: JsonHelper;

	private client: MongoClient;
	private db: Db;
	private collection: Collection;
	private dbName = "MongoDB";
	private collectionName: string;

	constructor(language: AvailableLanguages) {
		this.language = language;
		this.jsonHelper = new JsonHelper(language);
		this.logger = new Logger(language);
	}

	public async init() {
		this.client = new MongoClient("mongodb://localhost:27017", {
			useNewUrlParser: true,
			useUnifiedTopology: true
		});
		await this.client.connect();

		this.logger.highlight("Connected to MongoDB", "green");

		this.db = this.client.db("normative");

		this.collection =
			this.language === "English"
				? this.db.collection("EnglishEntries")
				: this.db.collection("SpanishEntries");

		this.collectionName = this.collection.namespace;

		this.logger.dbName = this.dbName;
		this.logger.collectionName = this.collectionName;
	}

	public async disconnect() {
		await this.client.close();
	}

	/**Sets a unique index on the active collection to prevent duplicate terms. Used only once per collection.*/
	private async setUniqueIndex() {
		await this.collection.createIndex("term", { unique: true });
		this.logger.highlight(
			"Set unique index to: " + this.collectionName,
			"green"
		);
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
			this.logger.uploadedOne(entryObject.term);
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
				if (error.name === "MongoError" && error.code === 11000)
					throw Error(
						"MongoDB cannot accept duplicate term: " + error.keyValue.term
					);
			}

			this.logger.uploadedOne(object.term);
		}

		this.logger.uploadedAll();
	}

	public async uploadSummary() {
		const summaryFilename = SUMMARY_TERM[this.language] + ".json";
		const summaryObject = this.jsonHelper.convertJsonToObject(summaryFilename);
		await this.collection.insertOne(summaryObject);

		this.logger.uploadedOne(summaryObject.term);
	}

	public getEntry(term: string) {
		return this.collection.findOne({ term });
	}

	public getAll() {
		return this.collection.find({}).toArray();
	}

	public getSummary() {
		const summaryTerm = SUMMARY_TERM[this.language];
		return this.collection.findOne({ term: summaryTerm });
	}

	public async deleteAll() {
		await this.collection.deleteMany({});
		this.logger.deletedAllEntries();
	}

	public async deleteEntry(term: string) {
		await this.collection.deleteOne({ term });
		this.logger.deletedOne(term);
	}

	public async deleteSummary() {
		const summaryTerm = SUMMARY_TERM[this.language];
		await this.collection.deleteOne({ term: summaryTerm });
		this.logger.deletedOne(summaryTerm);
	}
}
