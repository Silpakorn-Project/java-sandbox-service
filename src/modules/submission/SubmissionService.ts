import { InternalServerError } from "@app/utils/error";
import multer from "@koa/multer";
import { Inject, Service } from "typedi";
import winston from "winston";
import { SandboxDomainService } from "../sandbox/SandboxDomainSerfvice";
import { FileError } from "./errors/SubmissionError";

@Service()
export class SubmissionService {
    @Inject()
    private _sandboxDomainService: SandboxDomainService;

    public async submit(
        file: multer.File,
        requestId: string,
        log: winston.Logger,
    ) {
        console.log(process.env.IMAGE);
        if (!file) {
            throw new FileError("No file was uploaded");
        }

        if (file.mimetype !== "application/x-tar") {
            throw new FileError(
                `Uploaded file type is not supported! Mimetype was: ${file.mimetype}}. Supported types are application/x-tar and application/zstd.`,
            );
        }

        try {
            await this._sandboxDomainService.runTests(
                file.path,
                requestId,
                log,
            );
        } catch (e) {
            // ...
        }

        throw new InternalServerError("Not implemented yet");
    }
}
