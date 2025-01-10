import { RequestScopeContainer } from "@app/decorators/RequestScopeContainer";
import { CustomContext } from "@app/types";
import { InternalServerError } from "@app/utils/error";
import { Body, Ctx, JsonController, Post } from "routing-controllers";
import { ContainerInstance } from "typedi";
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
            throw new InternalServerError();
        }
    }
}
