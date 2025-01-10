import { Service } from "typedi";
import winston, { createLogger, format, transports } from "winston";
import { ILogger, Logger } from "./ILogger";

@Service(Logger)
export class WinstonLogger implements ILogger {
    private logger: winston.Logger;
    private requestId: string;

    constructor({ requestId }: { requestId?: string } = {}) {
        this.requestId = requestId;
        this.logger = createLogger({
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
    }

    public debug(message: string, ...args: any[]) {
        this.log("debug", message, ...args);
    }

    public info(message: string, ...args: any[]) {
        this.log("info", message, ...args);
    }

    public warn(message: string, ...args: any[]) {
        this.log("warn", message, ...args);
    }

    public error(message: string, ...args: any[]) {
        this.log("error", message, ...args);
    }

    public log(level: string, message: string, ...args: any[]) {
        if (this.logger) {
            this.logger.log(level, message, {
                requestId: this.requestId,
                ...args,
            });
        }
    }
}

const myFormat = format.printf(
    ({ level, message, timestamp, requestId, ...metadata }) => {
        return `${timestamp} [${
            requestId || "00000000-0000-0000-0000-000000000000"
        }] ${level}: ${message}, ${JSON.stringify(metadata)}`;
    },
);
