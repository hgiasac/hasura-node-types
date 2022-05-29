import * as express from "express";
import { json } from "body-parser";
import eventHandler from "./events";
import actionHandler from "./actions";
import schedulers from "./schedulers";

const router = express.Router();

router.post("/events", eventHandler);
router.post("/actions", actionHandler);
router.post("/schedulers", schedulers);

export default express()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  .use(json() as any)
  .use(router);
