import { SUPERSCRIPT } from "./constants";

/**Responsible for extracting text from a `cheerioEntry`, either tagged snippets (namely: `term`, `translation`, `definition`, `note`) or loose snippets (i.e. untagged, namely: `note`, `definition`, `similarTo`, `classifiedUnder`, `classifiedInto`. `tantamountTo`, `differentFrom`, `derivedFrom`, `derivedInto`, `reference`.*/
export default class CheerioExtractor {
	public getTaggedSnippets(cheerioEntry: CheerioElement): TaggedSnippets {
		let tagged: TaggedSnippets = {
			term: "",
			translation: "",
			definition: "",
			note: ""
		};

		for (let child of cheerioEntry.children) {
			if (child.type === "tag") {
				for (let name of ["term", "translation", "definition", "note"]) {
					if (child.name === name) {
						tagged[name] = this.getTaggedFieldText(child);
					}
				}
			}
		}

		if (tagged.term === "" && tagged.translation === "")
			throw Error("This paragraph is not an entry.");

		if (tagged.term === "")
			throw Error("Failed to find term for translation: " + tagged.translation);

		if (tagged.translation === "")
			throw Error("Failed to find translation for term: " + tagged.term);

		return tagged;
	}

	/**Get the text of a tagged field and returns the text, or an empty string if the tagged field does not exist.*/
	public getTaggedFieldText(taggedSegment: CheerioElement): string {
		let text = "";
		for (let child of taggedSegment.children) {
			text += this.extractText(child);
		}
		return text;
	}

	/**Extracts the text from an element and returns it. Adds `<i>` tags for text in italics. Adds `<sup>` tags for alphabetic superscript. Replaces ordinary number with superscript number.*/
	private extractText(element: CheerioElement): string {
		let text = "";

		if (
			element.type === "text" ||
			(element.type === "tag" && element.name === "em") ||
			(element.type === "tag" && element.name === "sup")
		) {
			if (element.type === "text") {
				// text += this.htmlEncoder.encode(element.data); // no need to encode for now
				text += element.data;
			} else if (element.type === "tag") {
				const tagContent = element.children[0].data as string;
				switch (element.name) {
					case "sup":
						// if numeric superscript
						if (!isNaN(+tagContent)) {
							text += SUPERSCRIPT[+tagContent];
						}
						// if alphabetic superscript
						else {
							text += "<sup>" + tagContent + "</sup>";
						}

						break;
					case "em":
						text +=
							"<i>" +
							// this.htmlEncoder.encode(element.children[0].data) + // no need to encode for now
							element.children[0].data +
							"</i>";
						break;
				}
			}
		} else {
			const problemEntry = element.parent.parent.children[0].children[0]
				.data as string;
			throw Error(
				`Unrecognized element type, neither "tag" nor "text".\nLook for styled line breaks in the entry: ${problemEntry}`
			);
		}
		return text;
	}

	/**Extracts all text snippets from a cheerio entry as long as the snippets are not part of a tagged field (`term`, `translation`, `definition`, `note`). It avoids tagged fields by excluding `child.type === "tag"` from the condition in the loop.*/
	public getLooseSnippets(cheerioEntry: CheerioElement): string[] {
		let buffer: string[] = []; // accumulates parts of field
		let looseFields: string[] = [];

		for (let child of cheerioEntry.children) {
			if (child.name === "br") {
				if (buffer.length > 0) {
					const fieldLine = buffer.join("").replace("\t", "");
					looseFields.push(fieldLine);
				}
				buffer = []; // empty out buffer at `<br>` (line break)
			} else if (
				child.type === "text" ||
				(child.type === "tag" && child.name === "em") ||
				(child.type === "tag" && child.name === "sup")
			) {
				if (child.data === " — ") continue; // ignore misc character in first line
				if (child.data === "\t") continue; // ignore misc character in first line

				let fieldText = this.extractText(child);
				buffer.push(fieldText);
			}
		}

		// add last item in buffer, only item not ending in `<br>`
		if (buffer.length > 0) {
			looseFields.push(buffer.join("").replace("\t", ""));
		}

		return looseFields;
	}
}
