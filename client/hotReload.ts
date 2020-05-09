export default require("electron-reload")(
	process.cwd() + "/client/index.html",
	{
		electron: require(process.cwd() + "/node_modules/electron")
	}
);
