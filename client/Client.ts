import { app, BrowserWindow, ipcMain } from "electron";
import dotenv from "dotenv";
import firebase from "firebase";
import DB from "../db/DB.interface";
import MongoDB from "../db/MongoDB";
import IpcChannel from "./channels/IpcChannel.interface";
import EntryChannel from "./channels/EntryChannel";
import SummaryChannel from "./channels/SummaryChannel";
import "./utils/hotReloadForHtml";
import AuthChannel from "./channels/AuthChannel";

/**Desktop client responsible for managing the app (main process), windows (renderer processes), and IPC channels.*/
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
		this.initializeFirebase();
	}

	/**Sets up all the channels for handling events from the renderer process.*/
	registerIpcChannels() {
		const ipcChannels: IpcChannel[] = [
			new EntryChannel(this.db),
			new SummaryChannel(this.db),
			new AuthChannel()
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
			webPreferences: { nodeIntegration: true, nativeWindowOpen: true } // enables `require` in index.html
		});

		this.window.loadURL("file://" + process.cwd() + "/client/index.html");
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

	private initializeFirebase() {
		dotenv.config();

		firebase.initializeApp({
			apiKey: process.env.API_KEY,
			authDomain: process.env.AUTH_DOMAIN,
			projectId: process.env.PROJECT_ID
		});
	}
}

new Client();
