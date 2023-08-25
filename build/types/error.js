export class APIError extends Error {
    constructor(options){
        super(options.message);
        this.options = options;
    }
}
