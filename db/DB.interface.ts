export default interface DB {
	init(): Promise<void> | void;
	disconnect(): Promise<void> | void;
	getCollectionName(): string;

	uploadAll(options: {
		fromSingleJsonFile?: boolean;
		fromMultipleJsonFiles: boolean;
	}): Promise<void>;
	uploadSummary(): Promise<void>;

	deleteAll(): Promise<void>;
	deleteEntry(targetTerm: string): Promise<any>;
	deleteSummary(targetTerm: string): Promise<any>;

	getAll(): Promise<any[]>;
	getEntry(targetTerm: string): Promise<any>;
	getSummary(): Promise<any>;
}
