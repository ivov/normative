import { IpcMainEvent, BrowserWindow } from "electron";
import querystring from "querystring";
import firebase from "firebase";
import dotenv from "dotenv";
import IpcChannel from "./IpcChannel.interface";
import MyOAuth2Provider from "../oauth/MyOAuth2Provider";

export default class AuthChannel implements IpcChannel {
	public name = "auth-channel";

	private getGoogleOAuthConfig() {
		dotenv.config();
		return {
			client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
			client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
			redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
			authorize_url: process.env.GOOGLE_OAUTH_AUTHORIZE_URL,
			response_type: process.env.GOOGLE_OAUTH_RESPONSE_TYPE,
			scope: process.env.GOOGLE_OAUTH_SCOPE
		};
	}

	public async handle(event: IpcMainEvent) {
		const config = this.getGoogleOAuthConfig();
		const provider = new MyOAuth2Provider(config);

		const loginWindow = new BrowserWindow({
			width: 600,
			height: 800,
			webPreferences: {
				nodeIntegration: false, // disabled for security
				contextIsolation: true // enabled for security
				// https://github.com/electron/electron/blob/master/docs/tutorial/security.md
			}
		});

		const response = await provider.perform(loginWindow);
		const query = querystring.parse(response as string);
		const oAuthCredential = firebase.auth.GoogleAuthProvider.credential(
			null,
			query.access_token as string
		);

		const userCredential = await firebase
			.auth()
			.signInWithCredential(oAuthCredential);

		loginWindow.close();

		if (userCredential === null || userCredential.user === null)
			throw Error("Sign in failed");

		event.sender.send(this.name, userCredential.user.displayName);

		// useful data:
		// userCredential.user.uid
		// userCredential.user.displayName
		// userCredential.user.photoURL
		// userCredential.additionalUserInfo.profile.email
		// userCredential.additionalUserInfo.profile.picture
		// userCredential.additionalUserInfo.profile.given_name
		// userCredential.additionalUserInfo.profile.family_name
		// userCredential.additionalUserInfo.profile.providerId
	}
}
