import { app, BrowserWindow, ipcMain } from "electron";
import DB from "../db/DB.interface";
import MongoDB from "../db/MongoDB";
import IpcChannel from "./channels/IpcChannel.interface";
import EntryChannel from "./channels/EntryChannel";
import SummaryChannel from "./channels/SummaryChannel";
import "./utils/hotReloadForHtml";

/**Desktop client responsible for managing the app (main processs), windows (renderer processes), and IPC channels.*/
export default class Client {
	window: BrowserWindow | null;
	db: DB;

	constructor() {
		app.on("ready", this.createWindow);
		app.on("window-all-closed", this.onWindowAllClosed);
		app.allowRendererProcessReuse = true;

		this.db = new MongoDB("English");
		this.db.init(); // async

		this.registerIpcChannels();
	}

	/**Sets up all the channels for handling events from the renderer process.*/
	registerIpcChannels() {
		const ipcChannels: IpcChannel[] = [
			new EntryChannel(this.db),
			new SummaryChannel(this.db)
		];

		ipcChannels.forEach(channel =>
			ipcMain.on(channel.name, (event, argument?: string) =>
				channel.handle(event, argument)
			)
		);
	}

	private createWindow() {
		this.window = new BrowserWindow({
			width: 800,
			height: 600,
			resizable: false,
			webPreferences: { nodeIntegration: true } // enables `require` in index.html
		});

		// this.window.loadURL("file://" + process.cwd() + "/build/client/index.html");
		this.window.loadURL("file://" + process.cwd() + "/client/index.html");

		console.log(process.cwd());
		this.window.webContents.openDevTools();

		this.window.on("closed", () => {
			this.window = null; // ensure destruction
		});
	}

	private onWindowAllClosed = () => {
		if (process.platform === "darwin") return; // keep process in background to replicate macOS
		this.db.disconnect();
		app.quit();
	};
}

new Client();
