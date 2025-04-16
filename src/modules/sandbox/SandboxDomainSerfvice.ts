import { ILogger, Logger } from "@app/utils/log";
import { exec } from "@app/utils/promisified-utils";
import { resolve } from "path";
import { Inject, Service } from "typedi";
import { TestCase } from "../submission/dto/SubmissionRequest";
import { SubmissionResponseModel } from "../submission/models/SubmissionModel";
import {
    CompilationError,
    OutputLitmitExceededError,
    TimeoutError,
} from "./errors/SandboxError";
import {
    RunCodeResponseModel,
    RunTestResponseModel,
} from "./models/ResponseModel";

@Service()
export class SandboxDomainService {
    private VOLUME_NAME = process.env.VOLUME_NAME ?? "submissions";
    private IMAGE = process.env.IMAGE ?? "openjdk:11";
    private DEFAULT_RUN_TIMEOUT_MS = 10000;

    @Inject(Logger)
    private _logger: ILogger;

    private getVolumeAndPath(requestId: string, outputPath: string) {
        const volumeMapping =
            process.env.NODE_ENV === "development"
                ? `${resolve(outputPath)}:/app`
                : `${this.VOLUME_NAME}:/app`;

        const containerWorkdir =
            process.env.NODE_ENV === "development"
                ? "/app/"
                : `/app/${requestId}`;

        return { volumeMapping, containerWorkdir };
    }

    private async createContainer(
        containerName: string,
        outputPath: string,
        requestId: string,
    ) {
        const { volumeMapping, containerWorkdir } = this.getVolumeAndPath(
            requestId,
            outputPath,
        );

        const command = [
            `docker run -dit`,
            `--name ${containerName}`,
            `--workdir ${containerWorkdir}`,
            `--volume ${volumeMapping}`,
            `${this.IMAGE}`,
            `bash`,
        ].join(" ");

        this._logger.info(`Creating container: ${command}`);
        await exec(command);
    }

    private async cleanupContainer(containerName: string) {
        try {
            await exec(`docker rm -f ${containerName}`);
        } catch (e) {
            this._logger.error(
                `Failed to clean up container: ${containerName}`,
                e,
            );
        }
    }

    private async compileCode(containerName: string, fileName: string) {
        try {
            const command = `docker exec ${containerName} javac ${fileName}`;
            this._logger.info(`Compiling code: ${command}`);
            await exec(command);
        } catch (error) {
            if (error.stderr) {
                throw new CompilationError(error.stderr, error.stdout);
            }
        }
    }

    private async runCompiledCode(
        containerName: string,
        fileName: string,
        input?: string,
    ): Promise<RunCodeResponseModel> {
        try {
            const className = fileName.replace(".java", "");
            const inputCommand = input ? `<<EOF\n${input}\nEOF` : "";

            const command = [
                `docker exec`,
                `${containerName}`,
                `bash -c`,
                `"java ${className} ${inputCommand}"`,
            ].join(" ");

            this._logger.info(`Running code in container: ${command}`);
            const { stdout, stderr } = await exec(command, {
                timeout: this.DEFAULT_RUN_TIMEOUT_MS,
            });

            return new RunCodeResponseModel(stdout, stderr);
        } catch (error) {
            if (error.stderr) {
                return new RunCodeResponseModel(error.stdout, error.stderr);
            }

            if (error.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
                throw new OutputLitmitExceededError();
            }

            if (error.killed) {
                throw new TimeoutError();
            }

            throw error;
        }
    }

    public async runAllTests(
        containerName: string,
        outputPath: string,
        requestId: string,
        testCases: TestCase[],
    ): Promise<SubmissionResponseModel> {
        await this.createContainer(containerName, outputPath, requestId);
        const results : RunTestResponseModel[] = [];

        try {
            const { stdout: fileName } = await exec(
                `find ${outputPath} -name "*.java" -printf '%f'`,
            );

            const trimmedFileName = fileName.trim();
            await this.compileCode(containerName, trimmedFileName);

            for (const testCase of testCases) {
                const { stdout, stderr } = await this.runCompiledCode(
                    containerName,
                    trimmedFileName,
                    testCase.input,
                );

                results.push(
                    new RunTestResponseModel(
                        stdout === testCase.expected_output,
                        testCase.input,
                        testCase.expected_output,
                        stdout,
                        stderr || undefined,
                    ),
                );
            }

            return SubmissionResponseModel.makeFromTestcasesAndTestResults(
                testCases,
                results,
            );
        } catch (error) {
            if (error instanceof CompilationError) {
                results.push(
                    new RunTestResponseModel(false, "", "", "", error.stderr),
                );
                return SubmissionResponseModel.makeFromTestcasesAndTestResults(
                    testCases,
                    results,
                );
            }

            throw error;
        } finally {
            await this.cleanupContainer(containerName);
        }
    }
}
