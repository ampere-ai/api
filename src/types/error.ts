interface APIErrorOptions {
	message: string | object;
	id?: string;
	code?: number;
}

export class APIError extends Error {
	public readonly options: APIErrorOptions;

	constructor(options: APIErrorOptions) {
		super(options.message.toString());
		this.options = options;
	}
}