import { createModel } from "../mod.js";
export default createModel({
    name: "gpt",
    parameters: {
        messages: {
            type: [],
            required: true
        }
    },
    execute: (options, emitter)=>{
        emitter.emit({
            done: true,
            cost: 0
        });
    }
});
