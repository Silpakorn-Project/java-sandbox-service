import { ILogger, Logger } from "@app/utils/log";
import { exec, writeFile } from "@app/utils/promisified-utils";
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
        const sourceCodeFilePath = join(outputPath, "Main.java");

        try {
            await exec(`mkdir -p ${outputPath}`);
            await writeFile(sourceCodeFilePath, request.sourceCode);
            await exec(`chmod -R 777 ${outputPath}`);

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
                    await exec(`rm -rf '${outputPath}'`);
                } catch (e) {
                    this._logger.error(`Could not clean up ${requestId}.`, e);
                }
            });
        }
    }
}
