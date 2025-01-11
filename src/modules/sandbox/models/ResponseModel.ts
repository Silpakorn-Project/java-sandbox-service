export class ResponseModel {
    public stderr: string;
    public stdout: string;

    constructor(stderr: string, stdout: string) {
        this.stderr = stderr;
        this.stdout = stdout;
    }
}
