import * as express from "express";
import { json } from "body-parser";
import eventHandler from "./events";
import actionHandler from "./actions";

const router = express.Router();

router.post("/events", eventHandler);
router.post("/actions", actionHandler);

export default express()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  .use(json() as any)
  .use(router);
