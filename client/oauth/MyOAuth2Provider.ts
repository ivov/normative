// WORK IN PROGRESS
// Based on: https://github.com/mironal/electron-oauth-helper

import Url from "url";
import { BrowserWindow, WebRequest } from "electron";
import { EventEmitter } from "events";
import querystring from "querystring";
import {
	OAuthConfigType,
	ResponseType,
	ImplicitGrantConfig
} from "./OAuthTypes";
import OAuth2EmitterType from "./OAuth2Emitter.interface";

export default class MyOAuth2Provider extends EventEmitter {
	config: OAuthConfigType;
	finished: boolean;
	userCancelError?: Error;

	constructor(config: OAuthConfigType) {
		super();
		this.config = config;
		this.finished = false;
	}

	async perform(loginWindow: BrowserWindow): Promise<ResponseType | string> {
		loginWindow.once("show", () => {
			loginWindow.once("close", () => {
				if (this.finished === false) {
					this.userCancelError = new Error("User cancelled");
				}
			});
		});

		// @ts-ignore FIXME
		const resp = await this.doFlowTask(this.config, this, loginWindow);
		this.finished = true;
		if (this.userCancelError) return Promise.reject(this.userCancelError);

		return Promise.resolve(resp);
	}

	async doFlowTask(
		config: ImplicitGrantConfig,
		emitter: OAuth2EmitterType,
		window: BrowserWindow
	): Promise<string> {
		const authorizeParameters = this.createAuthorizeParameters(config);
		emitter.emit("before-authorize-request", authorizeParameters);

		const authorizeUrl = `${config.authorize_url}?${querystring.stringify(
			authorizeParameters
		)}`;

		setImmediate(() => {
			window.loadURL(authorizeUrl, { userAgent: "Chrome" }); // workaround
		});

		const url = await this.awaitRedirect(
			config.redirect_uri,
			window.webContents.session.webRequest
		);

		const hash = (Url.parse(url, false).hash || "").replace(/^#/, "");
		if (hash.includes("error=")) {
			return Promise.reject(new Error(`Error response: ${hash}`));
		}
		return hash;
	}

	createAuthorizeParameters(config: OAuthConfigType) {
		const keys: (keyof OAuthConfigType)[] = [
			"client_id",
			"redirect_uri",
			"scope",
			"state",
			"response_type"
		];

		const parameter = Object.assign(
			{},
			keys.reduce((prev, key) => {
				if (typeof config[key] === "string") {
					prev[key] = config[key];
				}
				return prev;
			}, {} as OAuthConfigType)
		);

		return parameter;
	}

	awaitRedirect(redirectURL: string, webRequest: WebRequest): Promise<string> {
		if (!redirectURL || !webRequest)
			return Promise.reject(new Error("Invalid parameter"));

		const isRedirectURL = (url: string) => {
			return url.startsWith(redirectURL);
		};
		return new Promise(resolve => {
			let filterUrl = redirectURL;
			if (filterUrl.endsWith("*")) filterUrl += "*";

			webRequest.onBeforeRequest((detail: any, callback: any) => {
				// TODO: fix types
				if (isRedirectURL(detail.url)) {
					callback({ cancel: true });

					resolve(detail.url);
					return;
				}
				callback({ cancel: false });
			});

			webRequest.onBeforeRedirect({ urls: [filterUrl] }, (detail: any) => {
				// TODO: fix types
				if (isRedirectURL(detail.redirectURL)) {
					resolve(detail.redirectURL);
					return;
				}
			});
		});
	}
}
