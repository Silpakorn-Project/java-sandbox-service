export class RunCodeResponseModel {
    public stdout: string;
    public stderr: string;

    constructor(stdout: string, stderr: string) {
        this.stdout = stdout;
        this.stderr = stderr;
    }
}
