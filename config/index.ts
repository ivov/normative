import fs from "fs";
import dotenv from "dotenv";

/**Validates if .env file exists, loads env vars from .env file, validates if no env vars are missing, validates if file paths to DOCX files exist, and exports config object.*/

if (!fs.existsSync("config/.env"))
	throw Error("No .env file found at /config directory.");

dotenv.config({ path: "config/.env" });

const envVars = [
	"DOCX_PATH_ENGLISH",
	"DOCX_PATH_SPANISH",
	"FIREBASE_API_KEY",
	"FIREBASE_AUTH_DOMAIN",
	"FIREBASE_PROJECT_ID",
	"GOOGLE_OAUTH_CLIENT_ID",
	"GOOGLE_OAUTH_CLIENT_SECRET",
	"GOOGLE_OAUTH_REDIRECT_URI",
	"GOOGLE_OAUTH_AUTHORIZE_URL",
	"GOOGLE_OAUTH_RESPONSE_TYPE",
	"GOOGLE_OAUTH_SCOPE"
];

for (let envVar of envVars) {
	if (!process.env[envVar])
		throw Error("Env var missing in .env file: " + process.env[envVar]);
}

if (!fs.existsSync(process.env.DOCX_PATH_ENGLISH))
	throw Error("DOCX filepath in .env file does not exist.");

export default {
	docx: {
		englishFilepath: process.env.DOCX_PATH_ENGLISH,
		spanishFilepath: process.env.DOCX_PATH_SPANISH
	},
	firebase: {
		apiKey: process.env.FIREBASE_API_KEY,
		authDomain: process.env.FIREBASE_AUTH_DOMAIN,
		projectId: process.env.FIREBASE_PROJECT_ID
	},
	googleOAuth: {
		clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
		clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
		redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
		authorizeUrl: process.env.GOOGLE_OAUTH_AUTHORIZE_URL,
		responseType: process.env.GOOGLE_OAUTH_RESPONSE_TYPE,
		scope: process.env.GOOGLE_OAUTH_SCOPE
	}
};
