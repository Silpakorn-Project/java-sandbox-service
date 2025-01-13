import { extractClassName } from "@app/utils/class_name_extractor";
import { ILogger, Logger } from "@app/utils/log";
import { fileSystem } from "@app/utils/promisified-utils";
import multer from "@koa/multer";
import { join } from "path";
import { Inject, Service } from "typedi";
import { RunCodeResponseModel } from "../sandbox/models/ResponseModel";
import { SandboxDomainService } from "../sandbox/SandboxDomainSerfvice";
import { CodeExecutionRequest } from "./dto/CodeExecutionRequest";
import { FileError } from "./errors/CodeExecutionError";

@Service()
export class CodeExecutionService {
    @Inject(Logger)
    private _logger: ILogger;

    @Inject()
    private _sandboxDomainService: SandboxDomainService;

    public async run(
        request: CodeExecutionRequest,
        requestId: string,
    ): Promise<RunCodeResponseModel> {
        const containerName = `submission-${requestId}`;
        const outputPath = join("work", requestId);
        const fileName = extractClassName(request.source_code) + ".java";
        const sourceCodeFilePath = join(outputPath, fileName);

        try {
            await fileSystem.mkdir(outputPath);
            await fileSystem.writeFile(sourceCodeFilePath, request.source_code);
            await fileSystem.chmod(outputPath, 777);

            return await this._sandboxDomainService.runCode(
                containerName,
                outputPath,
                requestId,
            );
        } catch (error) {
            throw error;
        } finally {
            setImmediate(async () => {
                try {
                    await fileSystem.rm(outputPath, { recursive: true });
                } catch (e) {
                    this._logger.error(`Could not clean up ${requestId}.`, e);
                }
            });
        }
    }

    public async runWithFile(
        file: multer.File,
        requestId: string,
    ): Promise<RunCodeResponseModel> {
        if (!file.originalname.endsWith(".java")) {
            throw new FileError("Only .java files are supported.");
        }

        const containerName = `submission-${requestId}`;
        const outputPath = join("work", requestId);
        const sourceCodeFilePath = join(outputPath, file.originalname);

        try {
            await fileSystem.mkdir(outputPath);
            await fileSystem.copyFile(file.path, sourceCodeFilePath);
            await fileSystem.chmod(outputPath, 777);

            return await this._sandboxDomainService.runCode(
                containerName,
                outputPath,
                file.originalname,
                requestId,
            );
        } catch (error) {
            throw error;
        } finally {
            setImmediate(async () => {
                try {
                    await fileSystem.unlink(file.path);
                    await fileSystem.rm(outputPath, { recursive: true });
                } catch (e) {
                    this._logger.error(`Could not clean up ${requestId}.`, e);
                }
            });
        }
    }
}
