export abstract class ApplicationError extends Error {
    message: string;
    constructor(message: string) {
        super(message);
        this.message = message;
        this.name = this.constructor.name;
    }
}
