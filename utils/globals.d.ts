declare module "mammoth";

type AvailableLanguages = "English" | "Spanish";

type MongoDBCollection = "EnglishEntries" | "SpanishEntries" | "Summaries";

type MammothResult = {
	value: string;
	messages: { type: string; message: string }[];
};

type CheerioResult = { "0": { type: string; name: string; children: [] } };

type TaggedSnippets = {
	[index: string]: string;
	term: string;
	translation: string;
	definition: string;
	note: string;
};

type AllEntriesObject = { allEntries: { [key: string]: any }[] };

declare namespace NodeJS {
	export interface ProcessEnv {
		DOCX_PATH_ENGLISH: string;
		DOCX_PATH_SPANISH: string;
	}
}
