declare module "mammoth";

type AvailableLanguages = "English" | "Spanish";

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
