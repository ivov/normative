import JsonHelper from "../../utils/JsonHelper";

/**Responsible for managing the summary (i.e. the list of all unique terms) for each language in the dictionary.*/
export default class Summary {
	private terms: string[] = [];
	private language: AvailableLanguages;

	constructor(language: AvailableLanguages) {
		this.language = language;
	}

	public populate(object: { [key: string]: any }) {
		this.terms.push(...object.summary);
	}

	public getTerms() {
		return this.terms;
	}

	public addTerm(term: string) {
		this.terms.push(term);
	}

	/**Checks if the summary contains any duplicates. If so, deletes all produced JSON files and throws an error.*/
	public checkForDuplicates() {
		if (this.containsDuplicates()) {
			const jsonHelper = new JsonHelper(this.language);
			jsonHelper.deleteAllJsonFiles();
			throw Error("Duplicates found:\n" + this.getDuplicates());
		}
	}

	private containsDuplicates() {
		return this.terms.length !== new Set(this.terms).size;
	}

	private getDuplicates() {
		return this.terms
			.filter(
				(term: string, index: number) => this.terms.indexOf(term) != index
			)
			.join(", ");
	}
}
