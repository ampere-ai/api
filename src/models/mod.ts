import type { Emitter } from "../utils/emitter.js";

type BuiltInType = "string" | "number" | "boolean";

type ModelParameterType<T> = 
    T extends BuiltInType ? (
        T extends "string" ? string :
        T extends "number" ? number :
        T extends "boolean" ? boolean :
        never
    ) : T;

interface ModelParameter<T = BuiltInType | object> {
	/** Type of the parameter */
	type: T;

	/** Whether this parameter is required */
	required?: boolean;

	/** Default of this parameter, when it's not specified & optional */
	default?: ModelParameterType<T>;
}

export interface Model<Data extends ModelData & Record<string, any> = ModelData, Params extends Record<string, ModelParameter> = Record<string, ModelParameter>> {
	/** Name of the model */
	name: string;

	/** Parameters of the model */
	parameters: Params;

	/** Executor of the model */
	execute: (options: { [K in keyof Params]: ModelParameterType<Params[K]["type"]> }, emitter: Emitter<Data>) => Promise<void> | void;
}

/** Base return data for a model */
export interface ModelData {
	done: boolean;
	cost: number;
}

export function createModel<Data extends ModelData & Record<string, any>, Params extends Record<string, ModelParameter>>(
	model: Model<Data, Params>
): Model<Data, Params> {
	return model;
}