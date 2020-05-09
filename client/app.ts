import { app, BrowserWindow, ipcMain, IpcMainEvent } from "electron";
import MongoDB from "../db/MongoDB";
import IpcChannel from "./channels/IpcChannel.interface";
import TermChannel from "./channels/TermChannel";
import SummaryChannel from "./channels/SummaryChannel";
import DB from "../db/DB.interface";

export default class App {
	ipcMain = ipcMain;
	window: BrowserWindow | null;
	db: DB;
	ipcChannels: IpcChannel[];

	constructor() {
		// this.initializeIPC();

		app.on("ready", this.createWindow);
		app.on("window-all-closed", this.onWindowAllClosed);
		app.allowRendererProcessReuse = true;

		this.db = new MongoDB("English");
		this.db.init();

		this.registerIpcChannels();
	}

	registerIpcChannels() {
		const ipcChannels: IpcChannel[] = [
			new TermChannel(this.db),
			new SummaryChannel(this.db)
		];

		ipcChannels.forEach(channel =>
			ipcMain.on(channel.name, (event, argument?: string) =>
				channel.handle(event, argument)
			)
		);
	}

	private onWindowAllClosed() {
		if (process.platform === "darwin") return; // macOS
		app.quit();
	}

	private createWindow = () => {
		this.window = new BrowserWindow({
			width: 800,
			height: 600,
			resizable: false,
			webPreferences: { nodeIntegration: true } // enables `require` in index.html
		});

		this.window.loadURL("file://" + process.cwd() + "/client/index.html");
		this.window.webContents.openDevTools();

		this.initializeWindow();
	};

	/**Sets up all the events for `window`.*/
	private initializeWindow() {
		if (this.window === null) return;

		// this.window.webContents.on("did-finish-load", async () => {
		// 	await this.db.init();
		// const summary = await this.db.getSummaryDocument();
		// console.log(summary);
		// this.getTerm;
		// });

		this.window.on("closed", () => {
			this.window = null;
		});
	}

	// private async getTerm() {
	// 	const term = await db.getEntryDocument("agreement");
	// }

	/**Sets up all the events for the IPC module.*/
	private initializeIPC() {
		this.ipcMain.on("get-term", async (event, arg) => {
			// console.log("received a request for a term");
			const term = await this.db.getEntryDocument(arg);
			event.sender.send("get-term", term.translation);
		});
	}
}

new App();
