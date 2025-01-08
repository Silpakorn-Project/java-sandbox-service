import multer from "@koa/multer";
import { Ctx, Get, JsonController, Post, UseBefore } from "routing-controllers";
import { runTests } from "./sandbox";
import { CustomContext } from "./types";
import { BadRequestError } from "./utils/error";

// Singleton for now
const upload = multer({ dest: "uploads/" });

@JsonController()
export class SubmissionController {
    @Get("/status")
    async getStatus() {
        return { message: "OK" };
    }

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
