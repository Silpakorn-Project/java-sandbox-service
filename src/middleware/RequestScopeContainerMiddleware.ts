import { CustomContext } from "@app/types";
import { KoaMiddlewareInterface, Middleware } from "routing-controllers";
import { Container } from "typedi";

@Middleware({ type: "before" })
export class RequestScopeContainerMiddleware implements KoaMiddlewareInterface {
    async use(ctx: CustomContext, next: Function): Promise<void> {
        const requestId = ctx.headers["x-request-id"] || "default";
        const container = Container.of(requestId as string);

        ctx.state.container = container;

        try {
            await next();
        } finally {
            Container.reset(requestId as string);
        }
    }
}
