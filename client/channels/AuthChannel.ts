import { IpcMainEvent } from "electron";
import IpcChannel from "./IpcChannel.interface";
import firebase from "firebase";

export default class AuthChannel implements IpcChannel {
	public name = "auth-channel";

	public async handle(event: IpcMainEvent, targetTerm: string) {
		const authProvider = new firebase.auth.GoogleAuthProvider();

		firebase
			.auth()
			.signInWithPopup(authProvider)
			.then(result => {
				console.log(result);
				// const token = result.credential.accessToken;
				// const user = result.user;
				event.sender.send(this.name);
			})
			.catch(error => console.log(error));
	}
}
