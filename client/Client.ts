import { app, BrowserWindow, ipcMain } from "electron";
import MongoManager from "../data/MongoManager";

export default class Client {
	window: BrowserWindow | null;

	constructor() {
		app.on("ready", this.createWindow);

		app.on("window-all-closed", () => app.quit());
		app.allowRendererProcessReuse = true;
	}

	private createWindow = () => {
		this.window = new BrowserWindow({
			show: false, // enables `ready-to-show` event
			width: 800,
			height: 600,
			webPreferences: { nodeIntegration: true }
		});
		this.window.loadURL("file://" + process.cwd() + "/client/index.html");
		this.window.on("ready-to-show", this.getTerm);

		this.window.on("closed", () => (this.window = null));
		this.window.webContents.openDevTools();
	};

	private async getTerm() {
		const mongoManager = new MongoManager("English");
		await mongoManager.init();
		const term = await mongoManager.getEntryDocument("agreement");
		await mongoManager.disconnect();
		console.log(term);
	}
}

ipcMain.on("term-requested", () => {
	// TODO: fetch term from mongoDB
});
