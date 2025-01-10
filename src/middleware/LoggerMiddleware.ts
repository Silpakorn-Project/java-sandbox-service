import { GlobalLogger } from "@app/utils/logger";
import { Next } from "koa";
import { KoaMiddlewareInterface, Middleware } from "routing-controllers";
import { CustomContext } from "src/types";
import Container from "typedi";

@Middleware({ type: "before" })
export class LoggerMiddleware implements KoaMiddlewareInterface {
    async use(ctx: CustomContext, next: Next): Promise<void> {
        const start = Date.now();
        ctx.state.start = start;
        const requestId = ctx.requestId;
        const log = GlobalLogger.child({ requestId });
        Container.of(ctx.requestId).set("Logger", log);

        log.info(`${ctx.request.method} ${ctx.req.url}`, {
            ip: ctx.request.ip,
            origin: ctx.request.origin,
        });

        try {
            await next();
        } catch (e) {
            const ms = Date.now() - start;
            log.error(
                `Crashed ${ctx.request.method} ${ctx.req.url} in ${ms}ms`,
                {
                    error: e.message,
                },
            );
            throw e;
        }

        const ms = Date.now() - start;
        log.info(
            `Completed ${ctx.request.method} ${ctx.req.url} ${ctx.response.status} in ${ms}ms`,
        );
    }
}
