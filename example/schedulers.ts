import {
  AnyRecord,
  HasuraExpressContext,
  HasuraScheduledTriggerHandler,
  withExpress,
} from "../src";
import * as winston from "winston";

const EVENT_TRIGGER_HELLO = "hello";

const context = {
  type: "Action",
};

type AppContext = HasuraExpressContext<winston.Logger> & {
  type: string;
};

type AppHandler<
  P extends AnyRecord = AnyRecord,
  R extends AnyRecord = AnyRecord,
> = HasuraScheduledTriggerHandler<P, R, AppContext>;

const helloEvent: AppHandler = () => Promise.resolve({ hello: "world" });

const handlerMap = {
  [EVENT_TRIGGER_HELLO]: helloEvent,
};

export default withExpress<{
  type: string;
}>({
  context,
  logger: winston.createLogger(),
}).useScheduledTriggers(handlerMap);
