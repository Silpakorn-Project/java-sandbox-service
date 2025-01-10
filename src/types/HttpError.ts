import { ApplicationError } from "./ApplicationError";

export class HttpError extends ApplicationError {
    constructor(public readonly status: number, message: string) {
        super(message);
    }
}
