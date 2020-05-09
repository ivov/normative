import dotenv from "dotenv";
import JsonHelper from "../utils/JsonHelper";
import Logger from "../logs/Logger";

export default class FirestoreDB {
	// TODO: implement DB interface?
	private language: AvailableLanguages;
	private jsonHelper: JsonHelper;
	private logger: Logger;

	constructor(language: AvailableLanguages) {
		this.logger =
			language === "English" ? new Logger("English") : new Logger("Spanish");

		this.jsonHelper =
			language === "English"
				? new JsonHelper("English")
				: new JsonHelper("Spanish");
	}

	/**Initializes app with credentials as environment variables and returns a database instance.*/
	connectToFirestore() {
		const firebase = require("firebase");
		require("firebase/firestore"); // required for side-effects

		dotenv.config();

		firebase.initializeApp({
			apiKey: process.env.API_KEY,
			authDomain: process.env.AUTH_DOMAIN,
			projectId: process.env.PROJECT_ID
		});

		return firebase.firestore();
	}

	/**Uploads to Firestore all JSON files, including the summary, for a language.*/
	public async uploadToFirestore(language: AvailableLanguages) {
		const db = this.connectToFirestore();

		// summary filename at zeroth index unneeded
		const [_, ...entryFilenames] = await this.jsonHelper.getAllJsonFilenames();

		for (let filename of entryFilenames) {
			const entry = this.jsonHelper.convertJsonToEntry(filename);

			await db
				.collection(language + "-terms")
				.doc(entry.slug)
				.set({ ...entry }, { merge: true });

			this.logger.uploadedEntry({
				term: entry.term,
				collection: db.collection(language + "-terms"),
				db: "Firestore"
			});
		}

		const summaryOfEntries = this.jsonHelper.getSummary();

		await db
			.collection("Summaries")
			.doc(language + "-summary")
			.set({ ...summaryOfEntries });

		this.logger.uploadedEntry({
			term: _,
			collection: db.collection("Summaries"),
			db: "Firestore"
		});
	}

	/**Deletes all docs (including summary) for a given language from Firestore.
	See: https://firebase.google.com/docs/firestore/manage-data/delete-data */
	public async deleteFromFirestore() {
		const db = this.connectToFirestore();
		const batchSize = 20;
		const collectionRef = db.collection(this.language + "-terms");
		const query = collectionRef.orderBy("__name__").limit(batchSize);

		db.collection("Summaries")
			.doc(this.language + "-summary")
			.delete();

		// @ts-ignore
		const deleteQueryBatch = (query, resolve, reject) => {
			query
				.get()
				.then((snapshot: any) => {
					// no documents left, done
					if (snapshot.size == 0) return 0;

					// delete documents in batch
					let batch = db.batch();
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
		});
	}
}
