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

    public async runCode(sourceCode: string, id: string) {
        const containerName = `submission-${id}`;
        const outputPath = join("work", id);
        const sourceFilePath = join(outputPath, "Main.java");

        try {
            await exec(`mkdir -p ${outputPath}`);
            await writeFile(sourceFilePath, sourceCode);
            await exec(`chmod -R 777 ${outputPath}`);

            const { volume, path } = this.getVolumeAndPath(id);
            
            const command = [
                `docker run`,
                `--name ${containerName}`,
                `--workdir /app${path}`,
                `--volume ${volume}`,
                `${this.IMAGE}`,
                `sh -c`,
                `"javac Main.java && java Main"`,
            ].join(" ");

            this._logger.info(`Running code with '${command}'`);
            const { stdout: stdout, stderr: stderr } = await exec(command);

            return { stdout, stderr };
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
                    await exec(`rm -rf '${outputPath}'`);
                    this.cleanUp;
                } catch (e) {
                    this._logger.error(`Could not clean up ${id}`, e);
                }
            });
        }
    }

    public async runTests(path: string, id: string) {
        const containerName = `submission-${id}`;
        const outputPath = join("work", id);
        await extract(path, outputPath);

        try {
            await exec(`chmod -R 777 ${outputPath}`);

            const { volume, path } = this.getVolumeAndPath(id);

            const command = [
                `docker run`,
                `--name ${containerName}`,
                `--workdir /app`,
                `--volume ${volume}`,
                `${this.IMAGE}`,
                `mvn -f /app${path}/pom.xml test`,
            ].join(" ");

            this._logger.info(`Running tests with '${command}'`);
            const { stdout: testResults } = await exec(command);

            return { testResults };
        } catch (e) {
            console.error(e);
            throw e;
        } finally {
            setImmediate(async () => {
                try {
                    await unlink(path);
                    await exec(`rm -rf '${outputPath}'`);
                    this.cleanUp(containerName);
                } catch (e) {
                    this._logger.error(`Could not clean up ${id}.`, e);
                }
            });
        }
    }

    private async cleanUp(containerName: string) {
        this._logger.info(`Removing the container '${containerName}'`);
        const removeCommand = `docker rm -f ${containerName}`;
        await exec(removeCommand);
    }

    private getVolumeAndPath(id: string) {
        const outputPath = join("work", id);

        const volume =
            process.env.NODE_ENV === "development"
                ? `${resolve(outputPath)}:/app`
                : `${this.VOLUME_NAME}:/app`;

        const path = process.env.NODE_ENV === "development" ? "" : `/${id}`;

        return { volume, path };
    }
}
