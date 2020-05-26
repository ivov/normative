import { ipcRenderer } from "electron";

// Inspired by:
// https://blog.logrocket.com/electron-ipc-response-request-architecture-with-typescript/

/**Responsible for making the renderer's IPC requests in response to user actions.*/
export default class Requester {
	/**Sends the request to `Client` through a given channel, with optional arguments. Returns a promise with the response sent by the main process through that channel.*/
	public request<T>(channel: string, term?: string): Promise<T> {
		ipcRenderer.send(channel, term);

		return new Promise(resolve => {
			ipcRenderer.on(channel, (event, response) => {
				resolve(response);
			});
		});
	}
}
