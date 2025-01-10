import { RequestScopeContainer } from "@app/decorators/RequestScopeContainer";
import { CustomContext } from "@app/types";
import { InternalServerError } from "@app/utils/error";
import multer from "@koa/multer";
import {
    BadRequestError,
    Ctx,
    JsonController,
    Post,
    UseBefore,
} from "routing-controllers";
import { ContainerInstance } from "typedi";
import { SubmissionService } from "./SubmissionService";
import { FileError } from "./errors/SubmissionError";

// Singleton for now
const upload = multer({ dest: "uploads/" });

@JsonController("/api/v1/submission")
export class SubmissionController {
    @Post("/submit")
    @UseBefore(upload.single("file"))
    async submit(
        @Ctx() ctx: CustomContext,
        @RequestScopeContainer() container: ContainerInstance,
    ) {
        try {
            const submissionService = container.get(SubmissionService);
            await submissionService.submit(
                ctx.request.file,
                ctx.requestId,
                ctx.log,
            );
        } catch (error) {
            if (error instanceof FileError) {
                throw new BadRequestError(error.message);
            }

            throw new InternalServerError();
        }

        return { message: `ok` };
    }
}
