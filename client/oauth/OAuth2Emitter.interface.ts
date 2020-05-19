export default interface OAuth2EmitterType {
	emit(event: "before-authorize-request", parameters: object): boolean;
	emit(
		event: "before-access-token-request",
		parameters: object,
		headers: object
	): boolean;
}
