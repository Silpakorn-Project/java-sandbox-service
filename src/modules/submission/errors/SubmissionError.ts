import { ApplicationError } from "@app/types";

export class FileError extends ApplicationError {
    constructor(message: string) {
        super(message);
    }
}
