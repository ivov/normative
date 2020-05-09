import { IpcMainEvent } from "electron";
import IpcChannel from "./IpcChannel.interface";
import DB from "../../db/DB.interface";

export default class TermChannel implements IpcChannel {
	public name = "term-channel";
	private db: DB;

	constructor(db: DB) {
		this.db = db;
	}

	public async handle(event: IpcMainEvent, targetTerm: string) {
		const term = await this.db.getEntryDocument(targetTerm);
		event.sender.send(this.name, term);
	}
}
