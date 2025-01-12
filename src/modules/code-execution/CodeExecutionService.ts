import { ILogger, Logger } from "@app/utils/log";
import { fileSystem } from "@app/utils/promisified-utils";
import multer from "@koa/multer";
import { join } from "path";
import { Inject, Service } from "typedi";
import { ResponseModel } from "../sandbox/models/ResponseModel";
import { SandboxDomainService } from "../sandbox/SandboxDomainSerfvice";
import { CodeExecutionRequest } from "./dto/CodeExecutionRequest";

@Service()
export class CodeExecutionService {
    @Inject(Logger)
    private _logger: ILogger;

    @Inject()
    private _sandboxDomainService: SandboxDomainService;

    public async run(
        request: CodeExecutionRequest,
        requestId: string,
    ): Promise<ResponseModel> {
        const containerName = `submission-${requestId}`;
        const outputPath = join("work", requestId);
        const fileName = this.extractClassName(request.sourceCode) + ".java";
        const sourceCodeFilePath = join(outputPath, fileName);

        try {
            await fileSystem.mkdir(outputPath);
            await fileSystem.writeFile(sourceCodeFilePath, request.sourceCode);
            await fileSystem.chmod(outputPath, 777);

            return await this._sandboxDomainService.runCode(
                containerName,
                outputPath,
                fileName,
                requestId,
            );
        } catch (error) {
            throw error;
        } finally {
            setImmediate(async () => {
                try {
                    await fileSystem.rm(outputPath, { force: true });
                } catch (e) {
                    this._logger.error(`Could not clean up ${requestId}.`, e);
                }
            });
        }
    }

    public async runWithFile(
        file: multer.File,
        requestId: string,
    ): Promise<ResponseModel> {
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
                    await fileSystem.rm(outputPath, { force: true });
                } catch (e) {
                    this._logger.error(`Could not clean up ${requestId}.`, e);
                }
            });
        }
    }

    /**
     * Extracts the class name from Java source code.
     * @param sourceCode - The Java source code as a string.
     * @returns The class name, or null if no class name could be found.
     */
    private extractClassName(sourceCode: string): string | null {
        const classNameRegex = /public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/;
        const match = sourceCode.match(classNameRegex);
        return match ? match[1] : null;
    }
}
