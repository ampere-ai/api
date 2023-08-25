import EventEmitter from "events";

export class Emitter<T extends { done: boolean } & Record<string, any>> {
	private readonly emitter: EventEmitter;

	constructor() {
		this.emitter = new EventEmitter();
	}

	public emit(data: T) {
		this.emitter.emit("data", data);
	}

	public on(listener: (data: T) => void) {
		this.emitter.on("data", listener);
	}

	/** Wait until the request has been completed. */
	public async wait(): Promise<T> {
		return new Promise(resolve => {
			this.on(data => {
				if (data.done) resolve(data);
			});
		});
	}
}