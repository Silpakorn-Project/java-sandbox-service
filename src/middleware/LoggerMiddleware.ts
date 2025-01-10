import { Next } from "koa";
import { KoaMiddlewareInterface, Middleware } from "routing-controllers";
import { CustomContext } from "src/types";
import * as uuid from "uuid";
import { createLogger, format, transports } from "winston";

const myFormat = format.printf(
    ({ level, message, timestamp, requestId, ...metadata }) => {
        return `${timestamp} [${
            requestId || "00000000-0000-0000-0000-000000000000"
        }] ${level}: ${message}, ${JSON.stringify(metadata)}`;
    },
);

export const GlobalLogger = createLogger({
    level: "info",
    format: format.combine(
        format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }),
        format.colorize(),
        myFormat,
    ),
    transports: [new transports.Console()],
});

@Middleware({ type: "before" })
export class LoggerMiddleware implements KoaMiddlewareInterface {
    async use(ctx: CustomContext, next: Next): Promise<void> {
        const start = Date.now();
        ctx.state.start = start;
        const requestId = uuid.v4();
        const log = GlobalLogger.child({ requestId });
        ctx.log = log;
        ctx.requestId = requestId;
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
