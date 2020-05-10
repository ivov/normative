import dotenv from "dotenv";
import JsonHelper from "../utils/JsonHelper";
import Logger from "../logs/Logger";
import firebase from "firebase";
import "firebase/firestore"; // required for side effects
import DB from "./DB.interface";

export default class FirestoreDB implements DB {
	private language: AvailableLanguages;
	private logger: Logger;
	private jsonHelper: JsonHelper;

	private db: firebase.firestore.Firestore;
	private collection: firebase.firestore.CollectionReference;

	constructor(language: AvailableLanguages) {
		this.language = language;

		this.logger =
			language === "English" ? new Logger("English") : new Logger("Spanish");

		this.jsonHelper =
			language === "English"
				? new JsonHelper("English")
				: new JsonHelper("Spanish");
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

		console.log("Connected to Firestore");
	}

	disconnect() {
		firebase.database().goOffline();
	}

	getCollectionName(): string {
		return this.collection.id;
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

			this.logger.uploadedOne({
				term: entryObject.term,
				collection: this.getCollectionName(),
				db: "FirestoreDB"
			});
		}

		await this.uploadSummary();
	}

	async fromMultipleFiles() {
		const filenames = await this.jsonHelper.getAllJsonFilenames(); // entries and summary

		for (let filename of filenames) {
			const object = this.jsonHelper.convertJsonToObject(filename);
			await this.collection.doc(this.slugify(object.term)).set(object);

			this.logger.uploadedOne({
				term: object.term,
				collection: this.getCollectionName(),
				db: "FirestoreDB"
			});
		}

		this.logger.uploadedAll({
			collection: this.getCollectionName(),
			db: "FirestoreDB"
		});
	}

	public async uploadSummary() {
		const filename =
			this.language === "English"
				? "!summaryEnglish.json"
				: "!summarySpanish.json";

		const summaryObject = this.jsonHelper.convertJsonToObject(filename);

		await this.collection.doc(summaryObject.term).set(summaryObject);

		this.logger.uploadedOne({
			term: summaryObject.term, // "!summaryEnglish" or "!summarySpanish"
			collection: this.getCollectionName(),
			db: "FirestoreDB"
		});
	}

	/**Retrieves all the documents (entries and summary) in a FirestoreDB collection as an array of objects.*/
	public async getAll() {
		const snapshot = await this.collection.get();
		return snapshot.docs.map(doc => doc.data());
	}

	/**Retrieves a document entry in a FirestoreDB collection as an object.*/
	public async getEntry(targetTerm: string) {
		const snapshot = await this.collection.doc(this.slugify(targetTerm)).get();
		return snapshot.data();
	}

	/**Retrieves a summary entry in a FirestoreDB collection as an object.*/
	public async getSummary() {
		const summaryTerm =
			this.language === "English" ? "!summaryEnglish" : "!summarySpanish";
		const snapshot = await this.collection.doc(summaryTerm).get();
		return snapshot.data();
	}

	/**Deletes all docs (including summary) for a given language from Firestore.
	See: https://firebase.google.com/docs/firestore/manage-data/delete-data */
	public async deleteAll() {
		const batchSize = 20;
		// const collectionRef = this.db.collection(this.language + "-terms");
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
		}).then(() =>
			console.log(
				"Deleted all entries in Firestore collection " + this.collection.id
			)
		);
	}

	public async deleteEntry(targetTerm: string) {
		await this.collection.doc(this.slugify(targetTerm)).delete();

		this.logger.deletedEntry({
			term: targetTerm,
			collection: this.getCollectionName(),
			db: "FirestoreDB"
		});
	}

	public async deleteSummary() {
		const summaryTerm =
			this.language === "English" ? "!summaryEnglish" : "!summarySpanish";

		await this.collection.doc(summaryTerm).delete();

		this.logger.deletedEntry({
			term: summaryTerm,
			collection: this.getCollectionName(),
			db: "MongoDB"
		});
	}
}
