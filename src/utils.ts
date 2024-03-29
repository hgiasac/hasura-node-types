/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  HasuraActionPayload,
  HasuraActionError,
  VALIDATION_ERROR,
  XHasuraRole,
  HasuraEventPayload,
  INSERT,
  DELETE,
  UPDATE,
  MANUAL,
  XHasuraUserID,
  HasuraScheduledTriggerPayload,
} from "./types";

const LEVEL_INFO = "info";
const LEVEL_DEBUG = "debug";
const LEVEL_WARN = "warn";
const LEVEL_ERROR = "error";

type LogLevel =
  | typeof LEVEL_INFO
  | typeof LEVEL_DEBUG
  | typeof LEVEL_WARN
  | typeof LEVEL_ERROR;

export type Logger = {
  readonly log?: (...args: any[]) => void;
  readonly [LEVEL_DEBUG]: (...args: any[]) => void;
  readonly [LEVEL_INFO]: (...args: any[]) => void;
  readonly [LEVEL_WARN]: (...args: any[]) => void;
  readonly [LEVEL_ERROR]: (...args: any[]) => void;
};

export const defaultLogger = {
  log: console.log,
  debug: console.debug,
  info: console.log,
  warn: console.warn,
  error: console.error,
};

type PrintLogPayload = {
  readonly message: string;
  readonly level: LogLevel;
  [key: string]: any;
};

// common getters for actions
export function getActionUserID(payload: HasuraActionPayload): string | null {
  return payload.session_variables
    ? payload.session_variables[XHasuraUserID]
    : null;
}

export function getActionUserRole(payload: HasuraActionPayload): string | null {
  return payload.session_variables
    ? payload.session_variables[XHasuraRole]
    : null;
}

// common getters for event trigger
export function getEventUserID(payload: HasuraEventPayload): string | null {
  return payload.event && payload.event.session_variables
    ? payload.event.session_variables[XHasuraUserID]
    : null;
}

export function getEventUserRole(payload: HasuraEventPayload): string | null {
  return payload.event && payload.event.session_variables
    ? payload.event.session_variables[XHasuraRole]
    : null;
}

export function printLog(logger: Logger, payload: PrintLogPayload): void {
  if (logger.log && typeof logger.log === "function") {
    // print general log, support bunyan and console.log
    return logger.log(payload);
  }

  const level: LogLevel = !payload.level
    ? "info"
    : [LEVEL_INFO, LEVEL_DEBUG, LEVEL_WARN, LEVEL_ERROR].includes(payload.level)
    ? payload.level
    : "info";

  return logger[level](payload);
}

function assert(isPassed: boolean, message: string): void {
  if (!isPassed) {
    throw new HasuraActionError({
      message,
      extensions: {
        code: VALIDATION_ERROR,
      },
    });
  }
}

function preValidateBody(payload: any): Record<string, any> {
  assert(
    payload && typeof payload === "object" && !Array.isArray(payload),
    "empty or invalid body. Did you use `body-parser` json middleware?"
  );

  return payload as Record<string, any>;
}

function assertObject(input: any, message: string): void {
  assert(input && typeof input === "object" && !Array.isArray(input), message);
}

function isValidDate(d: unknown): boolean {
  if (!d) {
    return false;
  }

  switch (typeof d) {
    case "string":
    case "number":
      return !isNaN(new Date(d).getTime());
    case "object":
      return d instanceof Date && !isNaN(new Date(d).getTime());
    default:
      return false;
  }
}

export function validateActionPayload<
  P extends HasuraActionPayload = HasuraActionPayload
>(input: unknown): P {
  const payload = preValidateBody(input);
  assert(!!payload.action?.name, "empty hasura action name");

  assert(
    !!(payload.session_variables && payload.session_variables[XHasuraRole]),
    "invalid session_variables; user role property exists by default"
  );
  assertObject(payload.input, "invalid action input");

  return payload as P;
}

export function validateEventPayload<
  P extends HasuraEventPayload = HasuraEventPayload
>(input: unknown): P {
  const payload = preValidateBody(input);
  assert(!!payload.id, "empty hasura event trigger id");
  assert(!!payload.trigger?.name, "empty hasura event trigger name");
  assert(
    !!(payload.table?.name && payload.table?.schema),
    "empty hasura event trigger table"
  );
  assert(isValidDate(payload.created_at), "created_at is invalid date");

  assert(
    !!(
      payload.event?.session_variables &&
      payload.event.session_variables[XHasuraRole]
    ),
    "invalid session_variables; user role exists by default"
  );
  assertObject(payload.event.data, "invalid event data");

  switch (payload.event.op) {
    case INSERT:
      assert(!payload.event.data.old, "old data of INSERT event must be null");
      assertObject(
        payload.event.data.new,
        "new data of INSERT event must be an object"
      );
      break;
    case UPDATE:
      assertObject(
        payload.event.data.old,
        "old data of UPDATE event must be an object"
      );
      assertObject(
        payload.event.data.new,
        "new data of UPDATE event must be an object"
      );
      break;
    case DELETE:
      assertObject(
        payload.event.data.old,
        "old data of DELETE event must be an object"
      );
      assert(!payload.event.data.new, "new data of DELETE event must be null");
      break;
    case MANUAL:
      assert(!payload.event.data.old, "old data of MANUAL event must be null");
      assertObject(
        payload.event.data.new,
        "new data of MANUAL event must be an object"
      );
      break;
    default:
      assert(
        false,
        `invalid Hasura event trigger operation: ${payload.event.op as string}`
      );
  }

  return payload as P;
}

export function validateScheduledTriggerPayload<
  P extends HasuraScheduledTriggerPayload = HasuraScheduledTriggerPayload
>(input: unknown): P {
  const payload = preValidateBody(input);
  assert(!!payload.id, "empty hasura scheduled trigger id");
  assert(!!payload.name, "empty hasura scheduled trigger name");
  assert(isValidDate(payload.scheduled_time), `scheduled_time is invalid: ${payload.scheduled_time as string}`);

  return payload as P;
}
