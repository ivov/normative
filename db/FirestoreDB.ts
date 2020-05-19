import dotenv from "dotenv";
import "firebase/firestore"; // required for side effects
import firebase from "firebase";
import JsonHelper from "../utils/JsonHelper";
import Logger from "../logs/Logger";
import DB from "./DB.interface";
import { SUMMARY_TERM } from "../utils/constants";

export default class FirestoreDB implements DB {
	private language: AvailableLanguages;
	private logger: Logger;
	private jsonHelper: JsonHelper;

	private db: firebase.firestore.Firestore;
	private collection: firebase.firestore.CollectionReference;
	private dbName = "FirestoreDB";
	private collectionName: string;

	constructor(language: AvailableLanguages) {
		this.language = language;
		this.jsonHelper = new JsonHelper(language);
		this.logger = new Logger(language);
	}

	init() {
		dotenv.config();

		firebase.initializeApp({
			apiKey: process.env.API_KEY,
			authDomain: process.env.AUTH_DOMAIN,
			projectId: process.env.PROJECT_ID
		});

		this.db = firebase.firestore();

		this.collection =
			this.language === "English"
				? this.db.collection("EnglishEntries")
				: this.db.collection("SpanishEntries");

		this.collectionName = this.collection.id;

		this.logger.dbName = this.dbName;
		this.logger.collectionName = this.collectionName;

		this.logger.highlight("Connected to Firestore", "green");
	}

	disconnect() {
		firebase.database().goOffline();
	}

	/**Removes from a term the characters that are disallowed in a Firestore document name.*/
	slugify(term: string) {
		return term.replace(/\.|\//, "");
	}

	/**Uploads to Firestore all JSON files (entries and summary) for the given language.*/
	public async uploadAll(options: {
		fromSingleJsonFile?: boolean;
		fromMultipleJsonFiles?: boolean;
	}) {
		options.fromSingleJsonFile
			? await this.fromSingleFile()
			: await this.fromMultipleFiles();
	}

	async fromSingleFile() {
		const allEntriesObject = this.jsonHelper.getBigObjectFromSingleJsonFile();

		for (let entryObject of allEntriesObject.allEntries) {
			await this.collection
				.doc(this.slugify(entryObject.term))
				.set(entryObject);

			// `db.collection.doc(x).set({y})` overwrites entire document
			// `db.collection.doc(x).set({y}, {merge: true})` overwrites section of document
			// `db.collection.add({y})` adds new document

			this.logger.uploadedOne(entryObject.term);
		}

		await this.uploadSummary();
	}

	async fromMultipleFiles() {
		const filenames = await this.jsonHelper.getAllJsonFilenames(); // entries and summary

		for (let filename of filenames) {
			const object = this.jsonHelper.convertJsonToObject(filename);
			await this.collection.doc(this.slugify(object.term)).set(object);
			this.logger.uploadedOne(object.term);
		}

		this.logger.uploadedAll();
	}

	public async uploadSummary() {
		const summaryFilename = SUMMARY_TERM[this.language] + ".json";
		const summaryObject = this.jsonHelper.convertJsonToObject(summaryFilename);
		await this.collection.doc(summaryObject.term).set(summaryObject); // no need to slugify `summaryTerm`
		this.logger.uploadedOne(summaryObject.term);
	}

	/**Retrieves all the documents (entries and summary) in a FirestoreDB collection as an array of objects.*/
	public async getAll() {
		const snapshot = await this.collection.get();
		return snapshot.docs.map(doc => doc.data());
	}

	/**Retrieves a document entry in a FirestoreDB collection as an object.*/
	public async getEntry(term: string) {
		const snapshot = await this.collection.doc(this.slugify(term)).get();
		return snapshot.data();
	}

	/**Retrieves a summary entry in a FirestoreDB collection as an object.*/
	public async getSummary() {
		const summaryTerm = SUMMARY_TERM[this.language];
		const snapshot = await this.collection.doc(summaryTerm).get(); // no need to slugify `summaryTerm`
		return snapshot.data();
	}

	/**Deletes all docs (including summary) for a given language from Firestore.
	See: https://firebase.google.com/docs/firestore/manage-data/delete-data */
	public async deleteAll() {
		const batchSize = 20;

		const query = this.collection.orderBy("__name__").limit(batchSize);

		// @ts-ignore
		const deleteQueryBatch = (query, resolve, reject) => {
			query
				.get()
				.then((snapshot: any) => {
					// no documents left, done
					if (snapshot.size == 0) return 0;

					// delete documents in batch
					let batch = this.db.batch();
					snapshot.docs.forEach((doc: any) => {
						batch.delete(doc.ref);
					});

					return batch.commit().then(() => {
						return snapshot.size;
					});
				})
				.then((numDeleted: number) => {
					if (numDeleted === 0) {
						resolve();
						return;
					}

					// recurse on the next process tick, to avoid exploding the stack
					process.nextTick(() => {
						deleteQueryBatch(query, resolve, reject);
					});
				})
				.catch(reject);
		};

		return new Promise((resolve, reject) => {
			deleteQueryBatch(query, resolve, reject);
		}).then(() => this.logger.deletedAllEntries());
	}

	public async deleteEntry(term: string) {
		await this.collection.doc(this.slugify(term)).delete();
		this.logger.deletedOne(term);
	}

	public async deleteSummary() {
		const summaryTerm = SUMMARY_TERM[this.language];
		await this.collection.doc(summaryTerm).delete();
		this.logger.deletedOne(summaryTerm);
	}
}
