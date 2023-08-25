import { APIError } from "../types/error.js";
import { API_KEY } from "../config.js";
export function auth(req, _, next) {
    if (!req.headers.authorization) throw new APIError({
        message: "Invalid authorization",
        code: 403
    });
    if (req.headers.authorization !== API_KEY) throw new APIError({
        message: "Invalid authorization",
        code: 403
    });
    next();
}
