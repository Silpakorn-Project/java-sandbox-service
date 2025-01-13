import { RequestScopeContainer } from "@app/decorators/RequestScopeContainer";
import { CustomContext } from "@app/types";
import {
    InternalServerError,
    LoopDetectedError,
    RequestTimeoutError,
} from "@app/utils/error";
import { Logger } from "@app/utils/log";
import { Body, Ctx, JsonController, Post } from "routing-controllers";
import { ContainerInstance } from "typedi";
import {
    OutputLitmitExceededError,
    TimeoutError,
} from "../sandbox/errors/SandboxError";
import { SubmissionRequest } from "./dto/SubmissionRequest";
import { SubmissionService } from "./SubmissionService";

@JsonController("/api/v1/submit")
export class SubmissionController {
    @Post("/")
    public async submit(
        @Ctx() ctx: CustomContext,
        @Body() request: SubmissionRequest,
        @RequestScopeContainer() container: ContainerInstance,
    ) {
        try {
            const submissionService = container.get(SubmissionService);
            return await submissionService.submit(
                request.source_Code,
                request.test_cases,
                ctx.requestId,
            );
        } catch (error) {
            const _logger = container.get(Logger);
            _logger.error("[SubmissionController#submit]:", error);

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
