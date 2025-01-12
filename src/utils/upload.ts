import multer from "@koa/multer";

export const upload = multer({ dest: "uploads/" });
