import { extract } from "@app/utils/file_extractor";
import { ILogger, Logger } from "@app/utils/log";
import { exec, unlink } from "@app/utils/promisified-utils";
import multer from "@koa/multer";
import { join } from "path";
import { Inject, Service } from "typedi";
import { SandboxDomainService } from "../sandbox/SandboxDomainSerfvice";
import { FileError } from "./errors/SubmissionError";

@Service()
export class SubmissionService {
    @Inject(Logger)
    private _logger: ILogger;

    @Inject()
    private _sandboxDomainService: SandboxDomainService;

    public async submit(file: multer.File, requestId: string) {
        if (!file) {
            throw new FileError("No file was uploaded");
        }

        if (file.mimetype !== "application/x-tar") {
            throw new FileError(
                `Uploaded file type is not supported! Mimetype was: ${file.mimetype}}. Supported types are application/x-tar`,
            );
        }

        const containerName = `submission-${requestId}`;
        const outputPath = join("work", requestId);
        await extract(file.path, outputPath);

        try {
            await exec(`chmod -R 777 ${outputPath}`);

            return await this._sandboxDomainService.runTests(
                containerName,
                outputPath,
                requestId,
            );
        } catch (e) {
            throw e;
        } finally {
            setImmediate(async () => {
                try {
                    await unlink(file.path);
                    await exec(`rm -rf '${outputPath}'`);
                } catch (e) {
                    this._logger.error(`Could not clean up ${requestId}.`, e);
                }
            });
        }
    }
}
