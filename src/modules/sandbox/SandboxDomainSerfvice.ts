import { ILogger, Logger } from "@app/utils/log";
import { exec } from "@app/utils/promisified-utils";
import { resolve } from "path";
import { Inject, Service } from "typedi";
import { TestCase } from "../submission/dto/SubmissionRequest";
import { SubmissionResponseModel } from "../submission/models/SubmissionModel";
import { OutputLitmitExceededError, TimeoutError } from "./errors/SandboxError";
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

    public async runCode(
        containerName: string,
        outputPath: string,
        requestId: string,
        input?: string,
    ): Promise<RunCodeResponseModel> {
        try {
            const { volumeMapping, containerWorkdir } = this.getVolumeAndPath(
                requestId,
                outputPath,
            );

            const { stdout: fileName } = await exec(
                `find ${outputPath} -name "*.java" -printf '%f'`,
            );

            const inputCommand = input ? `echo "${input}" |` : "";

            const command = [
                `docker run --rm`,
                `--name ${containerName}`,
                `--workdir ${containerWorkdir}`,
                `--volume ${volumeMapping}`,
                `${this.IMAGE}`,
                `bash -c`,
                `"javac ${fileName} && ${inputCommand} java ${fileName.replace(".java", "")}"`,
            ].join(" ");

            this._logger.info(`Running code with '${command}'`);
            const { stdout: stdout, stderr: stderr } = await exec(command, {
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
        } finally {
            setImmediate(async () => {
                try {
                    await exec(`docker rm -f ${containerName}`);
                } catch (e) {
                    this._logger.error(`Could not clean up ${requestId}.`, e);
                }
            });
        }
    }

    public async runTest(
        containerName: string,
        outputPath: string,
        requestId: string,
        testCase: TestCase,
    ): Promise<RunTestResponseModel> {
        const { stdout: stdout, stderr: stderr } = await this.runCode(
            containerName,
            outputPath,
            requestId,
            testCase.input,
        );

        return new RunTestResponseModel(
            stdout === testCase.expected_output,
            testCase.input,
            testCase.expected_output,
            stdout,
            stderr || undefined,
        );
    }

    public async runAllTests(
        containerName: string,
        outputPath: string,
        requestId: string,
        testCases: TestCase[],
    ): Promise<SubmissionResponseModel> {
        try {
            const testResults = [];

            for (const testCase of testCases) {
                const testResult = await this.runTest(
                    containerName,
                    outputPath,
                    requestId,
                    testCase,
                );

                testResults.push(testResult);
            }

            const testCasePassed = testResults.filter(
                (testResult) => testResult.passed === true,
            ).length;

            const testCaseWrong = testResults.filter(
                (testResult) => testResult.passed === false,
            ).length;

            const submissionResponse: SubmissionResponseModel = {
                passed: testCasePassed === testCases.length,
                testcase_total: testCases.length,
                testcase_passed: testCasePassed,
                testcase_wrong: testCaseWrong,
                test_cases: testResults,
            };

            return submissionResponse;
        } catch (error) {
            throw error;
        }
    }

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
}
