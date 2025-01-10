import { Logger } from "@app/utils/log";
import { WinstonLogger } from "@app/utils/log/WinstonLogger";
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
        const logger = new WinstonLogger({ requestId });
        Container.of(requestId).set(Logger, logger);

        logger.info(`${ctx.request.method} ${ctx.req.url}`, {
            ip: ctx.request.ip,
            origin: ctx.request.origin,
        });

        try {
            await next();
        } catch (e) {
            const ms = Date.now() - start;
            logger.error(`${ctx.request.method} ${ctx.req.url} in ${ms}ms`, {
                error: e.message,
            });
            throw e;
        }

        const ms = Date.now() - start;
        logger.info(
            `Completed ${ctx.request.method} ${ctx.req.url} ${ctx.response.status} in ${ms}ms`,
        );
    }
}
