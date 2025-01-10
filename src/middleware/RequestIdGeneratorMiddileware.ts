import { CustomContext } from "@app/types";
import { KoaMiddlewareInterface, Middleware } from "routing-controllers";
import * as uuid from "uuid";

@Middleware({ type: "before" })
export class RequestIdGeneratorMiddleware implements KoaMiddlewareInterface {
    public async use(ctx: CustomContext, next: Function) {
        ctx.requestId = (ctx.headers["x-request-id"] ?? uuid.v4()) as string;
        await next();
    }
}
