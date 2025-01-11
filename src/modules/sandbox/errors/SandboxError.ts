import { ApplicationError } from "@app/types";

export class RunCodeError extends ApplicationError {
    constructor(stdout: string) {
        super(stdout);
    }
}

export class RunTestsError extends ApplicationError {
    constructor(stderr: string) {
        super(stderr);
    }
}

export class TimeoutError extends ApplicationError {
    constructor(message: string = "Execution exceeded the allowed time limit.") {
        super(message);
    }
}
