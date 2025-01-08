import { runTests } from "@app/sandbox";
import { CustomContext } from "@app/types";
import multer from "@koa/multer";
import {
    BadRequestError,
    Ctx,
    JsonController,
    Post,
    UseBefore,
} from "routing-controllers";

// Singleton for now
const upload = multer({ dest: "uploads/" });

@JsonController("/api/v1/submission")
export class SubmissionController {
    @Post("/submit")
    @UseBefore(upload.single("file"))
    async submit(@Ctx() ctx: CustomContext) {
        const file = ctx.request.file;

        if (!file) {
            ctx.status = 400;
            ctx.body = { message: "No file uploaded" };
            return;
        }

        if (ctx.file.mimetype !== "application/x-tar") {
            throw new BadRequestError(
                `Uploaded file type is not supported! Mimetype was: ${ctx.file.mimetype}}. Supported types are application/x-tar and application/zstd.`,
            );
        }

        try {
            await runTests(file.path, ctx.requestId, ctx.log);
        } catch (e) {
            // ...
        }

        return { message: `File ${file.originalname} uploaded` };
    }
}
