const ipcRenderer = require("electron").ipcRenderer;

ipcRenderer.send("summary-channel");

const button = document.getElementById("getTermButton") as HTMLElement;
const entryDiv = document.getElementById("entry") as HTMLElement;

// button.addEventListener("click", () => {
// 	ipcRenderer.send("get-term", "agreement");
// });

button.addEventListener("click", () => {
	ipcRenderer.send("term-channel", "agreement");
});

ipcRenderer.on("get-term", (event, arg) => {
	entryDiv.innerHTML = encode(arg);
});

const encode = (str: string) =>
	str.replace(/[\u00A0-\u9999<>\&]/gim, i => "&#" + i.charCodeAt(0) + ";");
