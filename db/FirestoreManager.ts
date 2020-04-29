import dotenv from "dotenv";
import dbLogger from "./dbLogger";
import JsonManager from "./JsonManager";

export default class FirestoreManager {
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
		const [_, ...entryFilenames] = await JsonManager.getAllJsonFilenames(
			language
		);

		for (let filename of entryFilenames) {
			const entry = JsonManager.convertJsonToEntry(language, filename);

			await db
				.collection(language + "-terms")
				.doc(entry.slug)
				.set({ ...entry }, { merge: true });

			dbLogger.uploadedToFirestore(language, entry.slug);
		}

		const summaryOfEntries = JsonManager.getSummaryOfEntries(language);

		await db
			.collection("Summaries")
			.doc(language + "-summary")
			.set({ ...summaryOfEntries });

		dbLogger.uploadedSummaryToFirestore(language);
	}

	/**Deletes all docs (including summary) for a given language from Firestore.
	See: https://firebase.google.com/docs/firestore/manage-data/delete-data */
	public async deleteFromFirestore(
		language: AvailableLanguages
	): Promise<void> {
		const db = this.connectToFirestore();
		const batchSize = 20;
		let collectionRef = db.collection(language + "-terms");
		let query = collectionRef.orderBy("__name__").limit(batchSize);

		db.collection("Summaries")
			.doc(language + "-summary")
			.delete();

		const deleteQueryBatch = (query: any, resolve: any, reject: any) => {
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
