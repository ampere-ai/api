import { APIError } from "../types/error.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function invalidPath(req, res, next) {
    throw new APIError({
        message: "Not found",
        code: 404
    });
}
