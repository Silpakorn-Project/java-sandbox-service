import { RequestScopeContainer } from "@app/decorators/RequestScopeContainer";
import { CustomContext } from "@app/types";
import {
    BadRequestError,
    InternalServerError,
    LoopDetectedError,
    RequestTimeoutError,
} from "@app/utils/error";
import { Logger } from "@app/utils/log";
import { upload } from "@app/utils/upload";
import {
    Body,
    Ctx,
    JsonController,
    Post,
    UseBefore,
} from "routing-controllers";
import { ContainerInstance } from "typedi";
import {
    OutputLitmitExceededError,
    TimeoutError,
} from "../sandbox/errors/SandboxError";
import { CodeExecutionService } from "./CodeExecutionService";
import { CodeExecutionRequest } from "./dto/CodeExecutionRequest";
import { FileError } from "./errors/CodeExecutionError";

@JsonController("/sandbox/run")
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
            const _logger = container.get(Logger);
            _logger.error("[CodeExecutionController#run]:", error);

            if (error instanceof OutputLitmitExceededError) {
                throw new LoopDetectedError(error.message);
            }

            if (error instanceof TimeoutError) {
                throw new RequestTimeoutError(error.message);
            }

            throw new InternalServerError();
        }
    }

    @Post("/file")
    @UseBefore(upload.single("file"))
    public async runWithFile(
        @Ctx() ctx: CustomContext,
        @RequestScopeContainer() container: ContainerInstance,
    ) {
        try {
            const runService = container.get(CodeExecutionService);
            return await runService.runWithFile(
                ctx.request.file,
                ctx.requestId,
            );
        } catch (error) {
            const _logger = container.get(Logger);
            _logger.error("[CodeExecutionController#run]:", error);

            if (error instanceof FileError) {
                throw new BadRequestError(error.message);
            }

            if (error instanceof OutputLitmitExceededError) {
                throw new LoopDetectedError(error.message);
            }

            if (error instanceof TimeoutError) {
                throw new RequestTimeoutError(error.message);
            }

            throw new InternalServerError();
        }
    }
}
