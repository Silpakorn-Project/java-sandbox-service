import * as DotEnv from "dotenv";
import "reflect-metadata";

import bodyParser from "koa-bodyparser";
import { createKoaServer } from "routing-controllers";
import {
    ErrorHandlerMiddleware,
    LoggerMiddleware,
    RequestIdGeneratorMiddleware,
    RequestScopeContainerLifeCycleMiddleware,
} from "./middleware";
import { HealthCheckController } from "./modules/healthcheck/HealthCheckController";
import { SubmissionController } from "./modules/submission/SubmissionController";

const app = createKoaServer({
    defaultErrorHandler: false,
    controllers: [SubmissionController, HealthCheckController],
    middlewares: [
        LoggerMiddleware,
        ErrorHandlerMiddleware,
        RequestIdGeneratorMiddleware,
        RequestScopeContainerLifeCycleMiddleware,
        bodyParser(),
    ],
});

DotEnv.config();

const port = process.env.PORT || 3000;

app.listen(port, () => {
    const modeMessage =
        process.env.NODE_ENV === "development" ? "Development" : "Production";
    console.log(
        `Server is running on port http://localhost:${port}/ (${modeMessage})`,
    );
});
