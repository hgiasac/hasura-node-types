/* eslint-disable @typescript-eslint/indent */
import {
  HasuraEventInsert,
  HasuraEventUpdate,
  HasuraEvent,
  AnyRecord,
  HasuraExpressContext,
  HasuraEventHandler,
  withExpress,
} from "../src";
import * as winston from "winston";

const EVENT_TRIGGER_HELLO = "hello";
const EVENT_TRIGGER_UPDATE_USER = "update_user";

const context = {
  type: "Action",
};

type AppContext = HasuraExpressContext<winston.Logger> & {
  type: string;
};

type AppHandler<
  EV extends HasuraEvent = HasuraEvent,
  R extends AnyRecord = AnyRecord,
  N extends string = string
> = HasuraEventHandler<EV, R, N, AppContext>;

const helloEvent: AppHandler<
  HasuraEventInsert<unknown>,
  { hello: string },
  typeof EVENT_TRIGGER_HELLO
> = () => Promise.resolve({ hello: "world" });

type UserInput = {
  readonly email: string;
  readonly password: string;
};

const userUpdateEvent: AppHandler<
  HasuraEventUpdate<UserInput>,
  UserInput,
  typeof EVENT_TRIGGER_UPDATE_USER
> = (ctx: AppContext, { event }) => {
  ctx.logger.info("winston logger");

  return Promise.resolve(event.data.new);
};

const handlerMap = {
  [EVENT_TRIGGER_HELLO]: helloEvent,
  [EVENT_TRIGGER_UPDATE_USER]: userUpdateEvent,
};

export default withExpress<{
  type: string;
}>({
  context,
  logger: winston.createLogger(),
}).useEvents(handlerMap);
