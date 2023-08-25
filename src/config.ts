import dotenv from "dotenv";
dotenv.config();

/** API authentication key */
export const API_KEY = process.env.API_KEY!;

/** Port to host the API on */
export const API_PORT = Number(process.env.API_PORT!);

/** Various third-party API keys */
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;