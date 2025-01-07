import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { controller } from "./controllers";

const app = new Koa();

const port = 3000;

app.use(bodyParser());

app.use(controller.routes())

app.listen(port, () => {
  console.log(`🚀 Server is running on port http://localhost:${port}/`);
});