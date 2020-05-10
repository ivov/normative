import IpcView from "./IpcView"; // enabled because of `require` in index.html
import Entry from "../db/models/Entry";

const ipcView = new IpcView();

const button = document.getElementById("getTermButton") as HTMLElement;
const entryDiv = document.getElementById("entry") as HTMLElement;

ipcView.request("summary-channel");

button.addEventListener("click", async () => {
	const entry: Entry = await ipcView.request("entry-channel", "agreement");
	entryDiv.innerHTML = entry.translation;
	// entryDiv.innerHTML = "whoa";
});
