import { ipcRenderer } from "electron";

/**Responsible for sending IPC requests in response to user actions. Used in the renderer process.*/
export default class IpcView {
	private ipcRenderer = ipcRenderer;

	/**Forwards the request to `Client`. `Client` processes the request based on its registered IPC channels and sends back a response. `IpcView` receives the response and returns it inside a promise.*/
	public request(channel: string, targetTerm?: string): Promise<any> {
		this.ipcRenderer.send(channel, targetTerm);

		return new Promise(resolve => {
			this.ipcRenderer.on(channel, (event, response) => {
				resolve(response);
			});
		});
	}
}
