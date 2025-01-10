import { KoaMiddlewareInterface, Middleware } from "routing-controllers";
import { Context } from "vm";

const UNKNOWN_ERROR_CODE = 400;

@Middleware({ type: "before" })
export class ErrorHandlerMiddleware implements KoaMiddlewareInterface {
    public async use(context: Context, next: any) {
        try {
            await next();
        } catch (error) {
            const { name, status, httpCode, message, errors, ...payload } =
                error;
            context.status = status || httpCode || UNKNOWN_ERROR_CODE;
            context.body = {
                type: name,
                message: message || name || undefined,
                errors,
                ...payload,
            };
        }
    }
}
