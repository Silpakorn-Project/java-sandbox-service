import { CustomContext } from "@app/types";
import { Next } from "koa";
import { KoaMiddlewareInterface, Middleware } from "routing-controllers";
import { Container } from "typedi";

@Middleware({ type: "before" })
export class RequestScopeContainerLifeCycleMiddleware
    implements KoaMiddlewareInterface
{
    async use(ctx: CustomContext, next: Next): Promise<void> {
        const requestId = ctx.requestId;
        Container.of(requestId);
        await next();
        Container.reset(requestId);
    }
}
