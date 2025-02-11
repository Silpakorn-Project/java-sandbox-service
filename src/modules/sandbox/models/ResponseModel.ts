export class RunCodeResponseModel {
    public stdout: string;
    public stderr: string;
    public output: string;

    constructor(stdout: string, stderr: string) {
        stdout = stdout.replace(/\n$/, '');
        this.stdout = stdout;
        this.stderr = stderr;
        
        this.output = stdout || stderr;
    }
}

export class RunTestResponseModel {
    public passed: boolean;
    public input: string;
    public expected: string;
    public actual: string;
    public error?: string;

    constructor(
        passed: boolean,
        input: string,
        expected: string,
        actual: string,
        error?: string,
    ) {
        this.passed = passed;
        this.input = input;
        this.expected = expected;
        this.actual = actual;
        this.error = error;
    }
}
