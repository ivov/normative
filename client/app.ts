import { app, BrowserWindow, ipcMain } from "electron";
import DB from "../db/DB.interface";
import MongoDB from "../db/MongoDB";
import IpcChannel from "./channels/IpcChannel.interface";
import TermChannel from "./channels/TermChannel";
import SummaryChannel from "./channels/SummaryChannel";
import "./hotReload";

export default class App {
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
			new TermChannel(this.db),
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
			webPreferences: { nodeIntegration: true } // enables `require` in index.html, TODO: unnecessary?
		});

		this.window.loadURL("file://" + process.cwd() + "/client/index.html");
		this.window.webContents.openDevTools();

		this.window.on("closed", () => {
			this.window = null; // ensure destruction
		});
	}

	private onWindowAllClosed() {
		if (process.platform === "darwin") return; // keep process in background to replicate macOS
		app.quit();
	}
}

new App();
