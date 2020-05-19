/**
 * WORK IN PROGRESS
 */

import IpcView from "./IpcView";
import Entry from "../db/models/Entry";

const ipcView = new IpcView();

const getTermButton = document.getElementById("get-term-button") as HTMLElement;
const loginButton = document.getElementById(
	"firebaseui-auth-container"
) as HTMLElement;
const entryDiv = document.getElementById("entry") as HTMLElement;
const usernameDiv = document.getElementById("username") as HTMLElement;

ipcView.request("summary-channel");

getTermButton.addEventListener("click", async () => {
	const entry: Entry = await ipcView.request("entry-channel", "agreement");
	entryDiv.innerHTML = entry.translation;
});

loginButton.addEventListener("click", async () => {
	const displayName = await ipcView.request("auth-channel");
	usernameDiv.innerHTML = displayName;
});
