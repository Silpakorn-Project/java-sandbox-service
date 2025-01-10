import { extract } from "@app/utils/file_extractor";
import { ILogger, Logger } from "@app/utils/log";
import { exec as origExec } from "child_process";
import {
    readFile as origReadFile,
    unlink as origUnlink,
    writeFile as origWriteFile,
} from "fs";
import { join, resolve } from "path";
import { Inject, Service } from "typedi";
import { promisify } from "util";

const exec = promisify(origExec);
const readFile = promisify(origReadFile);
const unlink = promisify(origUnlink);
const writeFile = promisify(origWriteFile);

@Service()
export class SandboxDomainService {
    private VOLUME_NAME = process.env.VOLUME_NAME ?? "submissions";
    private IMAGE = process.env.IMAGE ?? "maven:3-openjdk-11";

    @Inject(Logger)
    private _logger: ILogger;

    public async runCode(sourceCode: string, requestId: string) {
        const containerName = `submission-${requestId}`;
        const outputPath = join("work", requestId);
        const sourceCodeFilePath = join(outputPath, "Main.java");

        try {
            await exec(`mkdir -p ${outputPath}`);
            await writeFile(sourceCodeFilePath, sourceCode);
            await exec(`chmod -R 777 ${outputPath}`);

            const { volumeMapping, containerWorkdirPath } =
                this.getVolumeAndPath(requestId, outputPath);

            const command = [
                `docker run`,
                `--name ${containerName}`,
                `--workdir ${containerWorkdirPath}`,
                `--volume ${volumeMapping}`,
                `${this.IMAGE}`,
                `sh -c`,
                `"javac Main.java && java Main"`,
            ].join(" ");

            this._logger.info(`Running code with '${command}'`);
            const { stdout: stdout, stderr: stderr } = await exec(command);

            return { stdout, stderr };
        } catch (error) {

            console.error(error);
            throw error;
        } finally {
            setImmediate(async () => {
                try {
                    await exec(`rm -rf '${outputPath}'`);
                    this.cleanUp(containerName);
                } catch (e) {
                    this._logger.error(`Could not clean up ${requestId}`, e);
                }
            });
        }
    }

    public async runTests(filePath: string, requestId: string) {
        const containerName = `submission-${requestId}`;
        const outputPath = join("work", requestId);
        await extract(filePath, outputPath);

        try {
            await exec(`chmod -R 777 ${outputPath}`);

            const { volumeMapping, containerWorkdirPath } =
                this.getVolumeAndPath(requestId, outputPath);

            const command = [
                `docker run`,
                `--name ${containerName}`,
                `--workdir ${containerWorkdirPath}`,
                `--volume ${volumeMapping}`,
                `${this.IMAGE}`,
                `mvn -f ./pom.xml test`,
            ].join(" ");

            this._logger.info(`Running tests with '${command}'`);
            await exec(command);

            return { message: "Tests passed" };
        } catch (error) {
            if (error.stdout || error.stderr) {
                const stdout = error.stdout.trim() ?? null;
                const stderr = error.stderr.trim() ?? null;

                return { stdout, stderr };
            }

            console.error(error);
            throw error;
        } finally {
            setImmediate(async () => {
                try {
                    await unlink(filePath);
                    await exec(`rm -rf '${outputPath}'`);
                    this.cleanUp(containerName);
                } catch (e) {
                    this._logger.error(`Could not clean up ${requestId}.`, e);
                }
            });
        }
    }

    private async cleanUp(containerName: string) {
        this._logger.info(`Removing the container '${containerName}'`);
        const removeCommand = `docker rm -f ${containerName}`;
        await exec(removeCommand);
    }

    private getVolumeAndPath(requestId: string, outputPath: string) {
        const volumeMapping =
            process.env.NODE_ENV === "development"
                ? `${resolve(outputPath)}:/app`
                : `${this.VOLUME_NAME}:/app`;

        const containerWorkdirPath =
            process.env.NODE_ENV === "development" ? "/app/" : `/app/${requestId}`;

        return { volumeMapping, containerWorkdirPath };
    }
}
