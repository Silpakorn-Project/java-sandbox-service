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
