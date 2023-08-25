import EventEmitter from "events";
export class Emitter {
    constructor(){
        this.emitter = new EventEmitter();
    }
    emit(data) {
        this.emitter.emit("data", data);
    }
    on(listener) {
        this.emitter.on("data", listener);
    }
    /** Wait until the request has been completed. */ async wait(timeout = 120 * 1000) {
        return Promise.race([
            new Promise((resolve)=>{
                this.on((data)=>{
                    if (data.done) resolve(data);
                });
            }),
            new Promise((_, reject)=>{
                setTimeout(()=>{
                    reject(new Error("Timed out"));
                }, timeout);
            })
        ]);
    }
}
