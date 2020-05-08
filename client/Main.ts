import { app, BrowserWindow, ipcMain } from "electron";
import MongoDB from "../db/MongoDB";

export default class Main {
	window: BrowserWindow | null;

	constructor() {
		app.on("ready", this.createWindow);

		app.on("window-all-closed", () => app.quit());
		app.allowRendererProcessReuse = true;
	}

	private createWindow = () => {
		this.window = new BrowserWindow({
			width: 800,
			height: 600,
			resizable: false,
			webPreferences: { nodeIntegration: true }
		});
		this.window.loadURL("file://" + process.cwd() + "/client/index.html");
		this.window.webContents.on("did-finish-load", this.getTerm);

		this.window.on("closed", () => (this.window = null));
		this.window.webContents.openDevTools();
	};

	private async getTerm() {
		const mongoManager = new MongoDB("English");
		await mongoManager.init();
		const term = await mongoManager.getEntryDocument("agreement");
		await mongoManager.disconnect();
		console.log(term);
	}
}

ipcMain.on("term-requested", () => {
	// TODO: fetch term from mongoDB
});
