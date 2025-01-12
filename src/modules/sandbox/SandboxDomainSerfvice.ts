import { ILogger, Logger } from "@app/utils/log";
import { exec } from "@app/utils/promisified-utils";
import { resolve } from "path";
import { Inject, Service } from "typedi";
import { RunCodeError, TimeoutError } from "./errors/SandboxError";
import { ResponseModel } from "./models/ResponseModel";

@Service()
export class SandboxDomainService {
    private VOLUME_NAME = process.env.VOLUME_NAME ?? "submissions";
    private IMAGE = process.env.IMAGE ?? "maven:3-openjdk-11";

    private DEFAULT_RUN_TIMEOUT_MS = 5000;
    private DEFAULT_RUB_TESTS_TIMEOUT_MS = 180000;

    @Inject(Logger)
    private _logger: ILogger;

    public async runCode(
        containerName: string,
        outputPath: string,
        fileName: String,
        requestId: string,
    ): Promise<ResponseModel> {
        try {
            const { volumeMapping, containerWorkdir } = this.getVolumeAndPath(
                requestId,
                outputPath,
            );

            const command = [
                `docker run`,
                `--name ${containerName}`,
                `--workdir ${containerWorkdir}`,
                `--volume ${volumeMapping}`,
                `${this.IMAGE}`,
                `sh -c`,
                `"javac ${fileName} && java ${fileName.replace(".java", "")}"`,
            ].join(" ");

            this._logger.info(`Running code with '${command}'`);
            const { stdout: stdout, stderr: stderr } = await exec(command, {
                timeout: this.DEFAULT_RUN_TIMEOUT_MS,
            });

            return new ResponseModel(stdout, stderr);
        } catch (error) {
            if (error.killed) {
                throw new TimeoutError();
            }

            if (error.stderr) {
                throw new RunCodeError(error.stderr);
            }

            throw error;
        } finally {
            setImmediate(async () => {
                this.cleanUp(containerName);
            });
        }
    }

    public async runTests(
        containerName: string,
        outputPath: string,
        requestId: string,
    ) {
        try {
            const { volumeMapping, containerWorkdir } = this.getVolumeAndPath(
                requestId,
                outputPath,
            );

            const command = [
                `docker run`,
                `--name ${containerName}`,
                `--workdir ${containerWorkdir}`,
                `--volume ${volumeMapping}`,
                `${this.IMAGE}`,
                `mvn -f ./pom.xml test`,
            ].join(" ");

            this._logger.info(`Running tests with '${command}'`);
            await exec(command, {
                timeout: this.DEFAULT_RUB_TESTS_TIMEOUT_MS,
            });

            return { message: "Tests passed" };
        } catch (error) {
            if (error.stderr) {
                throw new RunCodeError(error.stderr);
            }

            throw error;
        } finally {
            setImmediate(async () => {
                this.cleanUp(containerName);
            });
        }
    }

    private async cleanUp(containerName: string) {
        setImmediate(async () => {
            try {
                this._logger.info(`Removing the container '${containerName}'`);
                const removeCommand = `docker rm --force ${containerName}`;
                await exec(removeCommand);
            } catch (e) {
                this._logger.error(
                    `Could not stop the container '${containerName}'.`,
                    e,
                );
            }
        });
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
