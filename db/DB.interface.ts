import Entry from "./models/Entry";

export default interface DB {
	init(): Promise<void> | void;
	disconnect(): Promise<void> | void;

	uploadAll(options: {
		fromSingleJsonFile?: boolean;
		fromMultipleJsonFiles: boolean;
	}): Promise<void>;
	uploadSummary(): Promise<void>;

	getAll(): Promise<Entry[]>;
	getAll(): Promise<any[]>;
	getEntry(term: string): Promise<Entry | null>;
	getSummary(): Promise<any>;

	deleteAll(): Promise<void>;
	deleteEntry(term: string): Promise<any>;
	deleteSummary(term: string): Promise<any>;
}
