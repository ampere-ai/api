import type { NextFunction, Request, Response } from "express";
import { APIError } from "../types/error.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function invalidPath(req: Request, res: Response, next: NextFunction) {
	throw new APIError({
		message: "Not found", code: 404
	});
}