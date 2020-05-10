import { Collection } from "mongodb";

export default interface DB {
	collection?: Collection;

	init(): Promise<void>;
	disconnect(): Promise<void>;
	getEntryDocument(targetTerm: string): Promise<any>;
	getAllDocuments(): Promise<any[]>;
	getSummaryDocument(): Promise<any>;
	deleteEntryDocument(targetTerm: string): Promise<any>;
}
