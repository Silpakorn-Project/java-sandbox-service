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

export class OutputLitmitExceededError extends ApplicationError {
    constructor(message: string = "Output size exceeded the allowed size limit.") {
        super(message);
    }
}

export class CompilationError extends Error {
    public stderr: string;
    public stdout?: string;

    constructor(stderr: string, stdout?: string) {
        super("Compilation failed.");
        this.name = "CompilationError";
        this.stderr = stderr;
        this.stdout = stdout;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CompilationError);
        }
    }
}
