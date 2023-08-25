interface APIErrorOptions {
	message: string;
	code?: number;
}

export class APIError extends Error {
	public readonly options: APIErrorOptions;

	constructor(options: APIErrorOptions) {
		super(options.message);
		this.options = options;
	}
}