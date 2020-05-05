import CheerioExtractor from "./CheerioExtractor";

/**Checks for duplicates in the terms of the entries of a `CheerioResult`.*/
export default class DuplicateChecker {
	static verify(cheerioResult: CheerioElement[]): void {
		const extractor = new CheerioExtractor();
		const entryTerms: string[] = [];

		for (let cheerioEntry of cheerioResult) {
			for (let child of cheerioEntry.children) {
				if (child.type === "tag" && child.name === "term") {
					const term = extractor.getTaggedFieldText(child);
					entryTerms.push(term);
				}
			}
		}

		if (this.containsDuplicates(entryTerms))
			throw Error("Duplicates found:\n" + this.getDuplicates(entryTerms));

		return;
	}

	private static containsDuplicates(array: string[]) {
		return array.length !== new Set(array).size;
	}

	private static getDuplicates(array: string[]) {
		return array
			.filter((item: string, index: number) => array.indexOf(item) != index)
			.join(", ");
	}
}
