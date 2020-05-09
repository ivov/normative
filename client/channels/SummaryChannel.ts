import { IpcMainEvent } from "electron";
import IpcChannel from "./IpcChannel.interface";
import DB from "../../db/DB.interface";

export default class SummaryChannel implements IpcChannel {
	public name = "summary-channel";
	private db: DB;

	constructor(db: DB) {
		this.db = db;
	}

	public async handle(event: IpcMainEvent) {
		const summary = await this.db.getSummaryDocument();
		console.log(summary);
		event.sender.send(this.name, summary);
	}
}
