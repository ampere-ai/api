import type { NextFunction, Request, Response } from "express";
import { bold } from "colorette";

import { APIError } from "../types/error.js";
import api from "../mod.js";

export function handleError(error: Error, req: Request, res: Response, next: NextFunction) {
	if (!(error instanceof APIError)) {
		api.logger.error(bold("An error occurred"), "->", error);

		res.status(500).send({
			message: error.message, success: false
		});

	} else {
		res.status(error.options.code ?? 500).send({
			message: error.options.message, success: false
		});
	}
}