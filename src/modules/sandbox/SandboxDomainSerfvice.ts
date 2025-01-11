import { ILogger, Logger } from "@app/utils/log";
import { exec } from "@app/utils/promisified-utils";
import { resolve } from "path";
import { Inject, Service } from "typedi";
import { RunCodeError } from "./errors/SandboxError";
import { ResponseModel } from "./models/ResponseModel";

@Service()
export class SandboxDomainService {
    private VOLUME_NAME = process.env.VOLUME_NAME ?? "submissions";
    private IMAGE = process.env.IMAGE ?? "maven:3-openjdk-11";
    private DEFAULT_RUN_TIMEOUT_MS = 10000;

    @Inject(Logger)
    private _logger: ILogger;

    public async runCode(
        containerName: string,
        outputPath: string,
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
                `"javac Main.java && java Main"`,
            ].join(" ");

            this._logger.info(`Running code with '${command}'`);
            const { stdout: stdout, stderr: stderr } = await exec(command, {
                timeout: this.DEFAULT_RUN_TIMEOUT_MS,
                killSignal: "SIGKILL",
            });

            return new ResponseModel(stderr, stdout);
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
            await exec(command);

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
