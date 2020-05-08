import MongoDB from "../db/MongoDB";

class Renderer {
	public async getTerm() {
		const mongoManager = new MongoDB("English");
		await mongoManager.init();

		const term = await mongoManager.getEntryDocument("agreement");

		await mongoManager.disconnect();
		console.log(term);
	}
}

const renderer = new Renderer();

renderer.getTerm();
