/**
 * WORK IN PROGRESS
 */

import Requester from "./Requester";
import Entry from "../db/models/Entry";

const requester = new Requester();

const getTermButton = document.getElementById("get-term-button") as HTMLElement;
const loginButton = document.getElementById("auth-button") as HTMLElement;
const entryDiv = document.getElementById("entry") as HTMLElement;
const usernameDiv = document.getElementById("username") as HTMLElement;
const entryBodyDiv = document.getElementById("entry-body") as HTMLElement;

requester.request("summary-channel");

getTermButton.addEventListener("click", async () => {
	const entry = await requester.request<Entry>("entry-channel", "agreement");
	entryDiv.innerHTML = entry.translation;
});

loginButton.addEventListener("click", async () => {
	const displayName = await requester.request<string>("auth-channel");
	usernameDiv.innerHTML = displayName;
});

const getEntryRowStyle = (exceptionForFirst?: boolean) => {
	if (exceptionForFirst) {
		// do not translate-y
		return (
			"cursor-pointer " +
			"py-3 px-4 " +
			"transition duration-300 ease-in-out bg-yellow-200 hover:bg-yellow-500 transform"
		);
	}
	return (
		"cursor-pointer " +
		"py-3 px-4 " +
		"transition duration-300 ease-in-out bg-yellow-200 hover:bg-yellow-500 transform hover:-translate-y-1"
	);
};

(async () => {
	const entry = await requester.request<Entry>("entry-channel", "agreement");

	let fullText = "";
	for (let property in entry) {
		if (property === "_id" || property === "slug") {
			continue;
		} else if (
			property === "classifiedUnder" ||
			property === "classifiedInto"
		) {
			// @ts-ignore
			entry[property].forEach(obj => {
				// console.log(obj);
				obj.contents.forEach(link => {
					fullText += link + " ";
				});
			});
		} else if (property === "derivedInto") {
			// @ts-ignore
			entry[property].forEach(link => {
				fullText += link + " ";
			});
		} else if (property === "term" || property === "translation") {
			fullText += entry[property] + "<br />";
		} else {
			console.log(property);
			fullText += entry[property] + "<br />";
		}
	}
	entryBodyDiv.innerHTML = fullText;
})();

(async () => {
	const entriesColumn = document.querySelector(".entries-column");
	const summary = await requester.request<string[]>("summary-channel");
	for (let entry of summary) {
		const entryDiv = document.createElement("div");
		if (summary.indexOf(entry) === 0) {
			entryDiv.className = getEntryRowStyle(true);
		} else {
			entryDiv.className = getEntryRowStyle();
		}

		entryDiv.innerHTML = entry;

		// @ts-ignore
		entriesColumn.append(entryDiv);
	}
})();
