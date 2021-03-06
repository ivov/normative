import { IpcMainEvent, BrowserWindow } from "electron";
import querystring from "querystring";
import firebase from "firebase";
import config from "../../config";
import IpcChannel from "./IpcChannel.interface";
import MyOAuth2Provider from "../oauth/MyOAuth2Provider";

export default class AuthChannel implements IpcChannel {
	public name = "auth-channel";

	private getGoogleOAuthConfig() {
		return {
			client_id: config.googleOAuth.clientId,
			client_secret: config.googleOAuth.clientSecret,
			redirect_uri: config.googleOAuth.redirectUri,
			authorize_url: config.googleOAuth.authorizeUrl,
			response_type: config.googleOAuth.responseType,
			scope: config.googleOAuth.scope
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
