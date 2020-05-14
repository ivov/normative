/**
 * WORK IN PROGRESS !!!
 */

import IpcView from "./IpcView"; // enabled because of `require` in index.html
import Entry from "../db/models/Entry";

// https://firebase.google.com/docs/auth/web/google-signin
// import firebase from "firebase";

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
	// entryDiv.innerHTML = "whoa";
});

loginButton.addEventListener("click", async () => {
	console.log("logging in");
	const displayName = await ipcView.request("auth-channel");
	usernameDiv.innerHTML = displayName;

	// dotenv.config();

	// const ui = new firebaseui.auth.AuthUI(firebase.auth());

	// ui.start("#firebaseui-auth-container", {
	// 	signInOptions: [firebase.auth.FacebookAuthProvider.PROVIDER_ID]
	// });

	// const authProvider = new firebase.auth.GoogleAuthProvider();

	// firebase.auth().signInWithRedirect(authProvider);

	// firebase
	// 	.auth()
	// 	.signInWithPopup(authProvider)
	// 	.then(result => {
	// 		console.log(result);
	// 		// const token = result.credential.accessToken;
	// 		// const user = result.user;
	// 	})
	// 	.catch(error => console.log(error));
});
