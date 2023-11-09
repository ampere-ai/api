import { StorageClient } from "@supabase/storage-js";
import { DB_KEY, DB_URL } from "../config.js";

const client = new StorageClient(`${DB_URL}/storage/v1`, {
	apikey: DB_KEY, Authorization: `Bearer ${DB_KEY}`
});

export function getStorageURL(bucket: string, path: string): string {
	const { data: { publicUrl: url } } = client.from(bucket).getPublicUrl(path);
	return url;
}

export async function uploadToStorage(bucket: string, path: string, body: any, type: string) {
	return client.from(bucket).upload(
		path, body, { contentType: type }
	);
}