export abstract class ApplicationError extends Error {
    public readonly name: string;
    public readonly message: string;
    public readonly stack?: string;

    constructor(message: string) {
        super(message);
        this.message = message;
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, this.constructor.prototype);
    }
}
