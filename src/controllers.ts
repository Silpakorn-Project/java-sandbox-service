import Router from "koa-router";

export const controller = new Router();

controller.get("/hello", (ctx, next) => {
  ctx.body = "Hello World!";
});
