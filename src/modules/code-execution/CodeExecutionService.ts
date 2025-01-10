import { Inject, Service } from "typedi";
import { SandboxDomainService } from "../sandbox/SandboxDomainSerfvice";
import { CodeExecutionRequest } from "./dto/CodeExecutionRequest";

@Service()
export class CodeExecutionService {
    @Inject()
    private _sandboxDomainService: SandboxDomainService;

    public async run(request: CodeExecutionRequest, id: string) {
        try {
            return await this._sandboxDomainService.runCode(
                request.sourceCode,
                id,
            );
        } catch (error) {
            throw error;
        }
    }
}
