import { RequestScopeContainer } from "@app/decorators/RequestScopeContainer";
import { CustomContext } from "@app/types";
import { BadRequestError, InternalServerError } from "@app/utils/error";
import { Logger } from "@app/utils/log";
import multer from "@koa/multer";
import { Ctx, JsonController, Post, UseBefore } from "routing-controllers";
import { ContainerInstance } from "typedi";
import { RunTestsError } from "../sandbox/errors/SandboxError";
import { FileError } from "./errors/SubmissionError";
import { SubmissionService } from "./SubmissionService";

// Singleton for now
const upload = multer({ dest: "uploads/" });

@JsonController("/api/v1/submit")
export class SubmissionController {
    @Post("/")
    @UseBefore(upload.single("file"))
    public async submit(
        @Ctx() ctx: CustomContext,
        @RequestScopeContainer() container: ContainerInstance,
    ) {
        try {
            const submissionService = container.get(SubmissionService);
            return await submissionService.submit(
                ctx.request.file,
                ctx.requestId,
            );
        } catch (error) {
            if (error instanceof RunTestsError) {
                return { stderr: error.message };
            }

            const _logger = container.get(Logger);
            _logger.error("[SubmissionController#submit]:", error);
            
            if (error instanceof FileError) {
                throw new BadRequestError(error.message);
            }

            throw new InternalServerError();
        }
    }
}
