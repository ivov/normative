export type ResponseType = {
	headers: object;
	statusCode: number;
	statusMessage: string;
	body: string;
};

export type OAuthConfigType = {
	response_type?: "code" | "token" | "password" | string;
	grant_type?:
		| "authorization_code"
		| "password"
		| "client_credentials"
		| string; // TODO: delete?
	scope?: string;
	client_id?: string;
	client_secret?: string;
	authorize_url?: string;
	access_token_url?: string;
	redirect_uri?: string;
	username?: string; // TODO: delete?
	password?: string; // TODO: delete?
	code?: string; // TODO: delete?
	state?: string; // TODO: delete?
};

export type ImplicitGrantConfig = Required<
	Pick<
		OAuthConfigType,
		"authorize_url" | "response_type" | "client_id" | "redirect_uri"
	>
>;
