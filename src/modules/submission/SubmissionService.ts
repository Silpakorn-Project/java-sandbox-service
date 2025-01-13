import { extractClassName } from "@app/utils/class_name_extractor";
import { ILogger, Logger } from "@app/utils/log";
import { fileSystem } from "@app/utils/promisified-utils";
import { join } from "path";
import { Inject, Service } from "typedi";
import { SandboxDomainService } from "../sandbox/SandboxDomainSerfvice";
import { TestCase } from "./dto/SubmissionRequest";

@Service()
export class SubmissionService {
    @Inject(Logger)
    private _logger: ILogger;

    @Inject()
    private _sandboxDomainService: SandboxDomainService;

    public async submit(
        sourceCode: string,
        testCases: TestCase[],
        requestId: string,
    ) {
        const containerName = `submission-${requestId}`;
        const outputPath = join("work", requestId);
        const fileName = extractClassName(sourceCode) + ".java";
        const sourceCodeFilePath = join(outputPath, fileName);

        try {
            await fileSystem.mkdir(outputPath);
            await fileSystem.writeFile(sourceCodeFilePath, sourceCode);
            await fileSystem.chmod(outputPath, 777);

            return await this._sandboxDomainService.runAllTests(
                containerName,
                outputPath,
                requestId,
                testCases,
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
}
