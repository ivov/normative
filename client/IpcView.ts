import { ipcRenderer } from "electron";

/**Responsible for sending IPC requests in response to user actions. Used in the renderer process.*/
export default class IpcView {
	private ipcRenderer = ipcRenderer;

	/**Forwards the channel and an optional target term to `Client`. `Client` processes the request based on its registered IPC channels and sends back a response. `IpcView` receives the response and returns it inside a promise.*/
	public request(channel: string, targetTerm?: string): Promise<any> {
		this.ipcRenderer.send(channel, targetTerm);

		return new Promise(resolve => {
			ipcRenderer.on(channel, (event, response) => {
				if (channel === "entry-channel")
					response.translation = this.encode(response.translation);

				resolve(response);
			});
		});
	}

	/**Replaces any character inside the Unicode range 00A0 to 9999 with its equivalent HTML entity.*/
	private encode(translation: string) {
		return translation.replace(/[\u00A0-\u9999<>\&]/gim, char => {
			return "&#" + char.charCodeAt(0) + ";";
		});
	}
}
