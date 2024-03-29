/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/indent */
import { Handler, Request, Response } from "express";
import {
  HASURA_ACTION_ERROR_STATUS,
  HASURA_ACTION_SUCCESS_STATUS,
  HasuraActionPayload,
  HasuraActionError,
  HASURA_EVENT_ERROR_STATUS,
  HASURA_EVENT_SUCCESS_STATUS,
  HasuraEventPayload,
  WithHasuraOptions,
  HasuraActionHandler,
  HasuraEventHandler,
  HasuraEventHandlerMap,
  HasuraActionHandlerMap,
  AnyRecord,
  HasuraEvent,
  BaseHasuraContext,
  WithHasura,
  HasuraScheduledTriggerPayload,
  HasuraScheduledTriggerHandler,
  HasuraScheduledTriggerHandlerMap,
  HASURA_SCHEDULED_TRIGGER_SUCCESS_STATUS,
  HASURA_SCHEDULED_TRIGGER_ERROR_STATUS,
} from "./types";
import {
  defaultLogger,
  printLog,
  validateActionPayload,
  validateEventPayload,
  Logger,
  validateScheduledTriggerPayload,
} from "./utils";

export type HasuraExpressContext<L extends Logger = Logger> =
  BaseHasuraContext<L> & {
    readonly request: Request;
  };

export type HasuraActionExpressHandler<
  P extends HasuraActionPayload = HasuraActionPayload,
  R extends AnyRecord = AnyRecord
> = HasuraActionHandler<P, R, HasuraExpressContext>;
export type HasuraActionExpressHandlerMap =
  HasuraActionHandlerMap<HasuraActionExpressHandler>;

export type HasuraEventExpressHandler<
  EV extends HasuraEvent = HasuraEvent,
  R extends AnyRecord = AnyRecord,
  N extends string = string
> = HasuraEventHandler<EV, R, N, HasuraExpressContext>;
export type HasuraEventExpressHandlerMap =
  HasuraEventHandlerMap<HasuraEventExpressHandler>;

export type HasuraScheduledTriggerExpressHandler<
  P = any,
  R = unknown
> = HasuraScheduledTriggerHandler<P, R, HasuraExpressContext>;

export type HasuraScheduledTriggerExpressHandlerMap =
  HasuraScheduledTriggerHandlerMap<HasuraScheduledTriggerExpressHandler>;

// Action wrapper and interfaces
type ExtraLoggingInfo = {
  readonly startTime: Date;
};

type WithActionInternalOptions = WithHasuraOptions & {
  readonly getAction: (
    body: HasuraActionPayload
  ) => Promise<HasuraActionExpressHandler>;
};
type WithActionInternal = (options: WithActionInternalOptions) => Handler;
type WithEventInternalOptions = WithHasuraOptions & {
  readonly getAction: (
    body: HasuraEventPayload
  ) => Promise<HasuraEventExpressHandler>;
};
type WithEventInternal = (options: WithEventInternalOptions) => Handler;

type WithScheduledTriggerInternalOptions = WithHasuraOptions & {
  readonly getAction: (
    body: HasuraScheduledTriggerPayload
  ) => Promise<HasuraScheduledTriggerExpressHandler>;
};
type WithScheduledTriggerInternal = (
  options: WithScheduledTriggerInternalOptions
) => Handler;

const withActionInternal: WithActionInternal =
  (options) =>
  async (req, res): Promise<Response> => {
    const {
      debug = false,
      logger = defaultLogger,
      logResponseData = false,
      context,
      getAction,
    } = options;

    const extraLoggingInfo = {
      startTime: new Date(),
    };

    try {
      validateActionPayload(req.body);
      const body = <HasuraActionPayload>req.body;

      const fn = await getAction(body);

      const result = await fn(
        {
          request: req,
          logger,
          debug,
          ...context,
        },
        body
      );

      printLog(logger, {
        ...serializeActionRequest(req, extraLoggingInfo, options),
        level: "info",
        message: `executed ${body.action.name} successfully`,
        response: debug || logResponseData ? result : null,
        http_code: HASURA_ACTION_SUCCESS_STATUS,
      });

      return res.status(HASURA_ACTION_SUCCESS_STATUS).json(result);
    } catch (err) {
      printLog(logger, {
        ...serializeActionRequest(req, extraLoggingInfo, options),
        level: "error",
        message: err.message,
        error: err,
        http_code: HASURA_ACTION_ERROR_STATUS,
        stack: debug ? err.stack : undefined,
      });

      return res.status(HASURA_ACTION_ERROR_STATUS).json({
        code: err.code,
        message: err.message,
      });
    }
  };

// Hasura event
const withEventInternal: WithEventInternal =
  (options): Handler =>
  async (req, res): Promise<Response> => {
    const {
      debug = false,
      logResponseData = false,
      logger = defaultLogger,
      context,
      getAction,
    } = options;

    const extraLoggingInfo = {
      startTime: new Date(),
    };

    try {
      validateEventPayload(req.body);
      const body = req.body as HasuraEventPayload;

      const fn = await getAction(body);
      const result = await fn(
        {
          request: req,
          logger,
          debug,
          ...context,
        },
        body
      );

      printLog(logger, {
        ...serializeTriggerRequest(req, extraLoggingInfo, options),
        level: "info",
        message: `executed trigger ${body.trigger.name} successfully`,
        response: debug || logResponseData ? result : null,
        http_code: HASURA_EVENT_SUCCESS_STATUS,
      });

      return res.status(HASURA_EVENT_SUCCESS_STATUS).json(result);
    } catch (err) {
      printLog(logger, {
        ...serializeTriggerRequest(req, extraLoggingInfo, options),
        level: "error",
        message: err.message,
        error: err,
        http_code: HASURA_EVENT_ERROR_STATUS,
        stack: debug ? err.stack : undefined,
      });

      return res.status(HASURA_EVENT_ERROR_STATUS).json({
        code: err.code,
        message: err.message,
        error: err,
        stack: debug ? err.stack : undefined,
      });
    }
  };

const withScheduledTriggerInternal: WithScheduledTriggerInternal =
  (options) =>
  async (req, res): Promise<Response> => {
    const {
      debug = false,
      logger = defaultLogger,
      logResponseData = false,
      context,
      getAction,
    } = options;

    const extraLoggingInfo = {
      startTime: new Date(),
    };

    try {
      validateScheduledTriggerPayload(req.body);
      const body = <HasuraScheduledTriggerPayload>req.body;

      const fn = await getAction(body);

      const result = await fn(
        {
          request: req,
          logger,
          debug,
          ...context,
        },
        body
      );

      printLog(logger, {
        ...serializeScheduledEventRequest(req, extraLoggingInfo, options),
        level: "info",
        message: `executed ${body.name} successfully`,
        response: debug || logResponseData ? result : null,
        http_code: HASURA_SCHEDULED_TRIGGER_SUCCESS_STATUS,
      });

      return res.status(HASURA_SCHEDULED_TRIGGER_SUCCESS_STATUS).json(result);
    } catch (err) {
      printLog(logger, {
        ...serializeScheduledEventRequest(req, extraLoggingInfo, options),
        level: "error",
        message: err.message,
        error: err,
        http_code: HASURA_SCHEDULED_TRIGGER_ERROR_STATUS,
        stack: debug ? err.stack : undefined,
      });

      return res.status(HASURA_SCHEDULED_TRIGGER_ERROR_STATUS).json({
        code: err.code,
        message: err.message,
      });
    }
  };

// logging serializer
function serializeTriggerRequest(
  req: Request,
  info: ExtraLoggingInfo,
  options: WithHasuraOptions
): AnyRecord {
  const body = (req.body || {}) as HasuraEventPayload;

  return {
    request_body: options.debug || options.logRequestBody ? body : null,
    request_header: req.headers,
    trigger_name: body.trigger ? body.trigger.name : null,
    latency: new Date().getTime() - info.startTime.getTime(),
  };
}

function serializeActionRequest(
  req: Request,
  info: ExtraLoggingInfo,
  options: WithHasuraOptions
): AnyRecord {
  const payload = (req.body || {}) as HasuraActionPayload;

  return {
    action_name: payload.action ? payload.action.name : null,
    session_variables: payload.session_variables,
    request_headers: req.headers,
    request_body:
      options.debug || options.logRequestBody ? payload.input : null,
    latency: new Date().getTime() - info.startTime.getTime(),
  };
}

function serializeScheduledEventRequest(
  req: Request,
  info: ExtraLoggingInfo,
  options: WithHasuraOptions
): AnyRecord {
  const payload = (req.body || {}) as HasuraScheduledTriggerPayload;

  return {
    event_name: payload.name ? payload.name : null,
    request_headers: req.headers,
    request_body:
      options.debug || options.logRequestBody ? payload.payload : null,
    latency: new Date().getTime() - info.startTime.getTime(),
  };
}

export const withExpress: <
  CtxOps extends AnyRecord = AnyRecord,
  L extends Logger = Logger
>(
  options?: WithHasuraOptions<CtxOps, L>
) => WithHasura<Handler, HasuraExpressContext<L> & CtxOps> = (options) => ({
  useEvent: (fn): Handler =>
    withEventInternal({
      ...options,
      getAction: () => Promise.resolve(fn),
    }),
  useEvents: (events): Handler =>
    withEventInternal({
      ...options,
      getAction: (body) => {
        const fn = events[body.trigger.name];
        const defaultFn = events.default || events["*"];

        if (!fn && !defaultFn) {
          return Promise.reject(
            new HasuraActionError({
              message: `trigger name ${body.trigger.name} doesn't exist`,
            })
          );
        }

        return Promise.resolve(fn || defaultFn);
      },
    }),
  useAction: (action): Handler =>
    withActionInternal({
      ...options,
      getAction: () => Promise.resolve(action),
    }),
  useActions: (actions): Handler =>
    withActionInternal({
      ...options,
      getAction: (body) => {
        const fn = actions[body.action.name];

        if (!fn) {
          return Promise.reject(
            new HasuraActionError({
              message: `action ${body.action.name} doesn't exist`,
            })
          );
        }

        return Promise.resolve(fn);
      },
    }),
  useScheduledTrigger: (event): Handler =>
    withScheduledTriggerInternal({
      ...options,
      getAction: () => Promise.resolve(event),
    }),
  useScheduledTriggers: (event): Handler =>
    withScheduledTriggerInternal({
      ...options,
      getAction: (body) => {
        const fn = event[body.name];

        if (!fn) {
          return Promise.reject(
            new HasuraActionError({
              message: `scheduled trigger ${body.name} doesn't exist`,
            })
          );
        }

        return Promise.resolve(fn);
      },
    }),
});
