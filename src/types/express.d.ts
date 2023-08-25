declare namespace Express {
	export interface Request {
		geo: {
			country: string;
			region: string;
		} | null;
	}
}