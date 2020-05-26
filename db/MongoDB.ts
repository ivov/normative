import { MongoClient, Db, Collection } from "mongodb";
import TerminalLogger from "../services/TerminalLogger";
import JsonHelper from "../services/JsonHelper";
import DB from "./DB.interface";
import { SUMMARY_TERM } from "../utils/constants";

export default class MongoDB implements DB {
	private language: AvailableLanguages;
	private terminalLogger: TerminalLogger;
	private jsonHelper: JsonHelper;

	private client: MongoClient;
	private db: Db;
	private collection: Collection;
	private dbName = "MongoDB";
	private collectionName: string;

	constructor(language: AvailableLanguages) {
		this.language = language;
		this.jsonHelper = new JsonHelper(language);
		this.terminalLogger = new TerminalLogger(language);
	}

	public async init() {
		this.client = new MongoClient("mongodb://localhost:27017", {
			useNewUrlParser: true,
			useUnifiedTopology: true
		});
		await this.client.connect();

		TerminalLogger.success("Connected to MongoDB");

		this.db = this.client.db("normative");

		this.collection =
			this.language === "English"
				? this.db.collection("EnglishEntries")
				: this.db.collection("SpanishEntries");

		this.collectionName = this.collection.namespace;

		this.terminalLogger.dbName = this.dbName;
		this.terminalLogger.collectionName = this.collectionName;
	}

	public async disconnect() {
		await this.client.close();
		TerminalLogger.success("Disconnected from MongoDB");
	}

	/**Sets a unique index on the active collection to prevent duplicate terms. Used only once per collection.*/
	private async setUniqueIndex() {
		await this.collection.createIndex("term", { unique: true });
		TerminalLogger.success("Set unique index to: " + this.collectionName);
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
		const { allEntries } = this.jsonHelper.getBigObjectFromSingleJsonFile();

		for (let entryObject of allEntries) {
			await this.collection.insertOne(entryObject);
			this.terminalLogger.uploadedOne(entryObject.term);
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

			this.terminalLogger.uploadedOne(object.term);
		}

		this.terminalLogger.uploadedAll();
	}

	public async uploadSummary() {
		const summaryFilename = SUMMARY_TERM[this.language] + ".json";
		const summaryObject = this.jsonHelper.convertJsonToObject(summaryFilename);
		await this.collection.insertOne(summaryObject);

		this.terminalLogger.uploadedOne(summaryObject.term);
	}

	public getEntry(term: string) {
		// TODO: convert mongoDB object to entry
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
		this.terminalLogger.deletedAllEntries();
	}

	public async deleteEntry(term: string) {
		await this.collection.deleteOne({ term });
		this.terminalLogger.deletedOne(term);
	}

	public async deleteSummary() {
		const summaryTerm = SUMMARY_TERM[this.language];
		await this.collection.deleteOne({ term: summaryTerm });
		this.terminalLogger.deletedOne(summaryTerm);
	}
}
