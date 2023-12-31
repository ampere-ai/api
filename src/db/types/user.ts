export interface DBUser {
	/** ID of the user */
	id: string;

	/** When the user first interacted with the bot */
	created: string;

    /** The user's metadata */
    metadata: Record<string, any>;

    /** The user's roles */
    roles: DBRole[];
}

export enum DBRole {
	Owner = "owner",
	Moderator = "moderator",
	Tester = "tester"
}

export const USER_ROLES = [
	DBRole.Owner, DBRole.Moderator, DBRole.Tester 
];