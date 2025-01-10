import { extract } from "@app/utils/file_extractor";
import { exec as origExec } from "child_process";
import { unlink as origUnlink } from "fs";
import { join, resolve } from "path";
import { Service } from "typedi";
import { promisify } from "util";
import winston from "winston";

const exec = promisify(origExec);
// const readFile = promisify(origReadFile);
const unlink = promisify(origUnlink);

@Service()
export class SandboxDomainService {
    public async runTests(path: string, id: string, log: winston.Logger) {
        const VOLUME_NAME = process.env.VOLUME_NAME ?? "submissions";
        const IMAGE = process.env.IMAGE ?? "maven:3-openjdk-11";
        
        const containerName = `submission-${id}`;
        const outputPath = join("work", id);
        await extract(path, outputPath);

        try {
            await exec(`chmod -R 777 ${outputPath}`);

            const volume =
                process.env.NODE_ENV === "development"
                    ? `${resolve(outputPath)}:/app`
                    : `${VOLUME_NAME}:/app`;

            const pomPath =
                process.env.NODE_ENV === "development" ? "" : `/${id}`;

            const command = [
                `docker run`,
                `--name ${containerName}`,
                `--workdir /app`,
                `--volume ${volume}`,
                `${IMAGE}`,
                `mvn -f /app${pomPath}/pom.xml test`,
            ].join(" ");

            log.info(`Running tests with '${command}'`);
            const { stdout: testResults } = await exec(command);

            console.log("Test Results:\n", testResults);
        } catch (e) {
            console.error(e);
            throw e;
        } finally {
            setImmediate(async () => {
                try {
                    await unlink(path);
                    await exec(`rm -rf '${outputPath}'`);
                } catch (e) {
                    log.error(`Could not clean up ${id}.`, e);
                }
            });

            log.info(`Removing the container '${containerName}'`);
            const removeCommand = `docker rm -f ${containerName}`;
            await exec(removeCommand);
        }
    }
}
