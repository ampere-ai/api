import type { NextFunction, Request, Response } from "express";
import { bold } from "colorette";

import { APIError } from "../types/error.js";
import api from "../mod.js";

export function handleError(error: Error, req: Request, res: Response, next: NextFunction) {

	if (!(error instanceof APIError)) {
		api.logger.error(bold("An error occurred"), "->", error);

		if (!res.headersSent) res.status(500);

		res.send({
			error: {
				message: error.message
			}, success: false
		});

	} else {
		if (!res.headersSent) res.status(error.options.code ?? 500);

		res.send({
			error: {
				message: error.options.message,
				id: error.options.id ?? null
			}, success: false
		});
	}
}