import multer from "@koa/multer";
import { randomUUID } from "crypto";
import Router from "koa-router";
import { runTests } from "./sandbox";

export const upload = multer({ dest: "uploads/" });

export const controller = new Router();

controller.get("/status", (ctx) => {
  ctx.body = { message: "OK" };
});

controller.post("/submit", upload.single("file"), async (ctx) => {
  const file = ctx.request.file;

  if (!file) {
    ctx.status = 400;
    ctx.body = { message: "No file uploaded" };
    return;
  }

  try {
    await runTests(file.path, randomUUID());
  } catch (e) {
    // ...
  }

  ctx.body = { message: `File ${file.originalname} uploaded` };
});
