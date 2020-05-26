import { IpcMainEvent } from "electron";
import IpcChannel from "./IpcChannel.interface";
import DB from "../../db/DB.interface";

export default class EntryChannel implements IpcChannel {
	public name = "entry-channel";
	private db: DB;

	constructor(db: DB) {
		this.db = db;
	}

	public async handle(event: IpcMainEvent, term: string) {
		const entry = await this.db.getEntry(term);

		if (!entry) {
			event.sender.send(this.name, "NO ENTRY FOUND");
			return;
		}

		entry.translation = this.encode(entry.translation);
		event.sender.send(this.name, entry);
	}

	/**Replaces any character inside the Unicode range 00A0 to 9999 with its equivalent HTML entity in the translation field. Prevents misencoded characters in the view.*/
	private encode(translation: string) {
		return translation.replace(/[\u00A0-\u9999<>\&]/gim, char => {
			return "&#" + char.charCodeAt(0) + ";";
		});
	}
}
