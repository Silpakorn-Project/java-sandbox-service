import { CustomContext } from "@app/types";
import { KoaMiddlewareInterface, Middleware } from "routing-controllers";
import { Container } from "typedi";

@Middleware({ type: "before" })
export class RequestScopeContainerLifeCycleMiddleware implements KoaMiddlewareInterface {
    async use(ctx: CustomContext, next: Function): Promise<void> {
        const requestId = ctx.requestId
        Container.of(requestId);

        try {
            await next();
        } finally {
            Container.reset(requestId);
        }
    }
}
