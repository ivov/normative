import { IpcMainEvent } from "electron";
import IpcChannel from "./IpcChannel.interface";
import DB from "../../db/DB.interface";

export default class EntryChannel implements IpcChannel {
	public name = "entry-channel";
	private db: DB;

	constructor(db: DB) {
		this.db = db;
	}

	public async handle(event: IpcMainEvent, targetTerm: string) {
		const entry = await this.db.getEntry(targetTerm);
		event.sender.send(this.name, entry);
	}
}
