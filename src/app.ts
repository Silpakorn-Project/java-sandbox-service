import "reflect-metadata";

import bodyParser from "koa-bodyparser";
import { createKoaServer } from "routing-controllers";
import { SubmissionController } from "./controllers";
import { LoggerMiddleware } from "./middleware/LoggerMiddleware";

const app = createKoaServer({
  controllers: [SubmissionController],
  middlewares: [LoggerMiddleware, bodyParser()],
});

const port = 3000;

app.listen(port, () => {
  const modeMessage = process.env.NODE_ENV === "development" ? "Development" : "Production";
  console.log(`Server is running on port http://localhost:${port}/ (${modeMessage})`);
});
