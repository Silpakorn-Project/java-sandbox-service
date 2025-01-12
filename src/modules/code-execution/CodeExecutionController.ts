import { RequestScopeContainer } from "@app/decorators/RequestScopeContainer";
import { CustomContext } from "@app/types";
import { InternalServerError, RequestTimeoutError } from "@app/utils/error";
import { Logger } from "@app/utils/log";
import { Body, Ctx, JsonController, Post } from "routing-controllers";
import { ContainerInstance } from "typedi";
import { RunCodeError, TimeoutError } from "../sandbox/errors/SandboxError";
import { CodeExecutionService } from "./CodeExecutionService";
import { CodeExecutionRequest } from "./dto/CodeExecutionRequest";

@JsonController("/api/v1/run")
export class CodeExecutionController {
    @Post("/")
    public async run(
        @Ctx() ctx: CustomContext,
        @Body() request: CodeExecutionRequest,
        @RequestScopeContainer() container: ContainerInstance,
    ) {
        try {
            const runService = container.get(CodeExecutionService);
            return await runService.run(request, ctx.requestId);
        } catch (error) {
            if (error instanceof RunCodeError) {
                return { stderr: error.message };
            }

            const _logger = container.get(Logger);
            _logger.error("[CodeExecutionController#run]:", error);

            if (error instanceof TimeoutError) {
                throw new RequestTimeoutError(error.message);
            }

            throw new InternalServerError();
        }
    }
}
