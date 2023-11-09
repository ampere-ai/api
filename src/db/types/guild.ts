export interface DBGuild {
	/** ID of the guild */
	id: string;

	/** When the guild first interacted with the bot */
	created: string;

    /** The guild's metadata */
    metadata: Record<string, any>;
}