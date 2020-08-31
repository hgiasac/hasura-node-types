/* eslint-disable @typescript-eslint/indent */
import { Logger } from "./utils";

export const AuthorizationHeader = "authorization";
export const XHasuraAdminSecret = "x-hasura-admin-secret";
export const XHasuraRole = "x-hasura-role";
export const XHasuraUserID = "x-hasura-user-id";
export const ContentType = "content-type";
export const ContentTypeJson = "application/json";

// default admin role
export const HASURA_ROLE_ADMIN = "admin";

export const HASURA_ACTION_SUCCESS_STATUS = 200;
export const HASURA_ACTION_ERROR_STATUS = 400;

export const HASURA_EVENT_SUCCESS_STATUS = 200;
export const HASURA_EVENT_ERROR_STATUS = 400;

export const VALIDATION_ERROR = "validation_error";
export type AnyRecord = Record<string, any>;

// event trigger payload
// https://hasura.io/docs/1.0/graphql/manual/event-triggers/payload.html

export type BaseSessionVariables<R extends string = string> = {
  readonly [XHasuraRole]: R
  readonly [XHasuraUserID]?: string
  readonly [key: string]: string
};

export type SessionVariables<T = BaseSessionVariables> = T | null;

export const INSERT = "INSERT";
export const UPDATE = "UPDATE";
export const DELETE = "DELETE";
export const MANUAL = "MANUAL";

export type HasuraEventOpName
  = typeof INSERT
  | typeof UPDATE
  | typeof DELETE
  | typeof MANUAL;

export type IHasuraEvent<
  OP extends HasuraEventOpName,
  O = AnyRecord,
  N = AnyRecord,
  S = SessionVariables> = {
    readonly session_variables: S
    readonly op: OP
    readonly data: {
      readonly old: O
      readonly new: N
    }
  };

export type HasuraEventInsert<
  N extends AnyRecord = AnyRecord,
  S extends SessionVariables = SessionVariables
  > = IHasuraEvent<typeof INSERT, null, N, S>;

export type HasuraEventUpdate<
  N extends AnyRecord = AnyRecord,
  S extends SessionVariables = SessionVariables
  > = IHasuraEvent<typeof UPDATE, N, N, S>;

export type HasuraEventDelete<
  N extends AnyRecord = AnyRecord,
  S extends SessionVariables = SessionVariables
  > = IHasuraEvent<typeof DELETE, N, null, S>;

export type HasuraEventManual<
  N extends AnyRecord = AnyRecord,
  S extends SessionVariables = SessionVariables
  > = IHasuraEvent<typeof MANUAL, null, N, S>;

export type HasuraEventInfo<N = string> = {
  readonly name: N
};

export type HasuraEvent<
  N extends AnyRecord = AnyRecord,
  S extends SessionVariables = SessionVariables>
  = HasuraEventInsert<N, S>
  | HasuraEventUpdate<N, S>
  | HasuraEventDelete<N, S>
  | HasuraEventManual<N, S>;

export type HasuraEventTriggerTable = {
  readonly schema: string
  readonly name: string
};

export type HasuraEventPayload<
  E extends IHasuraEvent<HasuraEventOpName> = HasuraEvent,
  N = string
  > = {
    readonly event: E
    readonly created_at: string
    readonly id: string
    readonly trigger: HasuraEventInfo<N>
    readonly table: HasuraEventTriggerTable
  };

// Event trigger handler interfaces
export type HasuraEventHandler<
  EV extends HasuraEvent = HasuraEvent,
  R extends AnyRecord = AnyRecord,
  N extends string = string,
  Ctx extends BaseHasuraContext = BaseHasuraContext
  > = (ctx: Ctx, payload: HasuraEventPayload<EV, N>) => Promise<R>;

export type HasuraEventHandlerMap<H extends HasuraEventHandler = HasuraEventHandler> = Record<string, H>;
// action handler interface
// https://hasura.io/docs/1.0/graphql/manual/actions/action-handlers.html#action-handlers
export type HasuraActionPayload<T = AnyRecord, A = string, S = SessionVariables> = {
  readonly action: {
    readonly name: A
  }
  readonly session_variables: S
  readonly input: T
};

export type HasuraActionErrorResponse = {
  readonly message: string
  readonly code?: string
};

export class HasuraActionError extends Error implements HasuraActionErrorResponse {

  public readonly code?: string;
  public readonly message: string;
  public readonly details?: any;

  constructor(
    { message, code, details }: HasuraActionErrorResponse & { readonly details?: any }) {
    super(message);
    this.message = message;
    this.code = code;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.details = details;
  }

}

// Hasura api wrapper interfaces
export type BaseHasuraContext<L extends Logger = Logger> = {
  readonly logger: L
  readonly debug: boolean
};

export type HasuraActionHandler<
  P extends HasuraActionPayload = HasuraActionPayload,
  R extends AnyRecord = AnyRecord,
  Ctx extends BaseHasuraContext = BaseHasuraContext
  > = (ctx: Ctx, payload: P) => Promise<R>;

export type HasuraActionHandlerMap<H extends HasuraActionHandler = HasuraActionHandler> = {
  readonly [key: string]: H
};

export type WithHasura<H, Ctx extends BaseHasuraContext> = {
  readonly useActions: (handlers: HasuraActionHandlerMap<HasuraActionHandler<HasuraActionPayload, AnyRecord, Ctx>>) => H
  readonly useAction: <
    P extends HasuraActionPayload = HasuraActionPayload,
    R extends AnyRecord = AnyRecord
    >(handler: HasuraActionHandler<P, R, Ctx>) => H
  readonly useEvents: (handlers: HasuraEventHandlerMap<HasuraEventHandler<HasuraEvent, AnyRecord, string, Ctx>>) => H
  readonly useEvent: <
    EV extends HasuraEvent = HasuraEvent,
    R extends AnyRecord = AnyRecord,
    N extends string = string
    >(handler: HasuraEventHandler<EV, R, N>) => H
};

export type WithHasuraOptions<
  Ctx extends AnyRecord = AnyRecord,
  L extends Logger = Logger
  > = {
    readonly logger?: L
    readonly debug?: boolean
    readonly logRequestBody?: boolean
    readonly logResponseData?: boolean
    readonly context?: Ctx
  };
