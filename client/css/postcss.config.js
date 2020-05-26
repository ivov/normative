const cssnano = require("cssnano");
const purgecss = require("@fullhuman/postcss-purgecss");

const prod = process.env.NODE_ENV === "production";

module.exports = {
	plugins: [
		require("tailwindcss"),
		require("postcss-copy")({
			dest: "build/client/assets" // for now, only fonts
		}),
		prod ? require("autoprefixer") : null,
		prod ? cssnano({ preset: "default" }) : null,
		prod
			? purgecss({
					content: ["./client/index.html"],
					defaultExtractor: content => content.match(/[A-Za-z0-9-_:/]+/g) || []
			  })
			: null
	]
};
