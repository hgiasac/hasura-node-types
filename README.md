# Hasura Node Types

Integrate type-safe nodejs backend application with Hasura, from TypeScript with love

- [Hasura Node Types](#hasura-node-types)
  - [Installation](#installation)
  - [Event Trigger](#event-trigger)
  - [Action](#action)
  - [With Express](#with-express)
    - [Options](#options)
    - [useActions([handlerMap])](#useactionshandlermap)
    - [useAction([handler])](#useactionhandler)
    - [useEvents([handlerMap])](#useeventshandlermap)
    - [useEvent([handler])](#useeventhandler)
    - [Logging](#logging)
  - [Common Getters](#common-getters)
    - [Action](#action-1)
    - [Event Trigger](#event-trigger-1)


## Installation

```bash
$ npm install --save hasura-node-types
```

## Event Trigger

Event payload follows [Hasura docs](https://hasura.io/docs/1.0/graphql/manual/event-triggers/payload.html)

```ts
import { 
  HasuraEventPayload, 
  // trigger event operations
  HasuraEventUpdate, 
  // HasuraEventInsert, 
  // HasuraEventDelete,
  // HasuraEventManual,
} from "hasura-node-types";

type EventPayload = HasuraEventPayload<HasuraEventUpdate<{
  email: string
  password: string
}>>

const payload: EventPayload = res.body;

// or you can use default any payload
const payload: HasuraEventPayload = res.body;
```

## Action

Action payload follow [Hasura docs](https://hasura.io/docs/1.0/graphql/manual/actions/action-handlers.html#action-handlers)

```ts
import { HasuraEventPayload, HasuraEventUpdate } from "hasura-node-types";

type LoginInput = {
  readonly email: string
  readonly password: string
};


type ActionPayload = HasuraActionPayload<LoginInput, typeof ACTION_LOGIN>;

const payload: ActionPayload = res.body;

// or you can use default any payload
const payload: HasuraActionPayload = res.body;
```

## With Express

Thank to GraphQL Engine payload structure, we can apply Factory Pattern that use single endpoint for multiple events, distinguished by event/action name 

```ts
type WithHasuraOptions<Ctx extends AnyRecord = AnyRecord> = {
  readonly logger?: Logger
  readonly debug?: boolean
  readonly logRequestBody?: boolean
  readonly logResponseData?: boolean
  readonly context?: Ctx
};

const we = withExpress([options])
```

This instance is Action and Event Trigger wrappers for Express handlers

### Options

- *logger*: Logging instance, use `console.log` by default. Support common libraries that implement logger interface (`winston`, `bunyan`)
- *debug*: show response data when printing logging. This field is also included in `context`
- *context*: extra context data
- *logRequestBody*: should log request body or not. This option is always true if debug is true
- *logResponseData*: should log response data or not. This option is always true if debug is true


### useActions([handlerMap])

Wrap Express handler with pre-validation, select and run action function from handler map 
  
```ts

import { withExpress } from "hasura-node-types";
const ACTION_LOGIN = "login";

type LoginInput = {
  readonly email: string
  readonly password: string
};

type LoginOutput = LoginInput;

const loginAction: HasuraActionExpressHandler<
  HasuraActionPayload<LoginInput, typeof ACTION_LOGIN>,
  LoginOutput
> = (ctx, { input }) => Promise.resolve(input);

const handlerMap = {
  [ACTION_LOGIN]: loginAction
};

export default withExpress().useActions(handlerMap);

```

With `HasuraActionHandler` function is defined as:

```ts
type HasuraActionExpressContext = {
  logger: Logger
  request: Request
  // extra contexts
}

type HasuraActionHandler<Payload, Resp> = (ctx: HasuraActionExpressContext, payload: Payload) => Promise<Resp>
```

### useAction([handler])

Use this function If you prefer using multiple routes instead

```ts

const we = withExpress();
const router = express.Router();

router.post("/actions/login", we.useAction(loginAction));
router.post("/actions/logout", we.useAction(logoutAction));
```

### useEvents([handlerMap])

Wraps Express handler with pre-validation, select and run event trigger functions from handler map 
  
```ts

const EVENT_TRIGGER_UPDATE_USER = "update_user";

type UserInput = {
  readonly email: string
  readonly password: string
};

const userUpdateEvent: HasuraEventExpressHandler<
  HasuraEventUpdate<UserInput>,
  UserInput,
  typeof EVENT_TRIGGER_UPDATE_USER
> = (_, { event }) => Promise.resolve(event.data.new);

const handlerMap = {
  [EVENT_TRIGGER_UPDATE_USER]: userUpdateEvent
};

export default withExpress().useEvents(handlerMap);

```

### useEvent([handler])

Use this function If you prefer using multiple routes instead

```ts

const we = withExpress();
const router = express.Router();

router.post("/events/update-user", we.useEvent(updateUser));
router.post("/events/delete-user", we.useEvent(deleteUser));
```

### Logging

Logging structure follows GraphQL engine styles, using JSON format

*Note*": Response 

- Success action log
```json
{
  "action_name": "login",
  "session_variables": { "x-hasura-role": "anonymous" },
  "request_headers": {
    "host": "127.0.0.1:40763",
    "accept-encoding": "gzip, deflate",
    "user-agent": "node-superagent/3.8.3",
    "content-type": "application/json",
    "content-length": "176",
    "connection": "close"
  },
  "request_body": { 
    "email": "example@domain.com", 
    "password": "123456" 
  },
  "latency": 4,
  "level": "info",
  "message": "executed login successfully",
  "response": null,
  "http_code": 200
}
```
- Failure action log
```json
{
  "action_name": null,
  "session_variables": { "x-hasura-role": "anonymous" },
  "request_headers": {
    "host": "127.0.0.1:33013",
    "accept-encoding": "gzip, deflate",
    "user-agent": "node-superagent/3.8.3",
    "content-type": "application/json",
    "content-length": "50",
    "connection": "close"
  },
  "request_body": null,
  "latency": 0,
  "level": "error",
  "message": "empty hasura action name",
  "error": {
    "code": "validation_error",
    "details": null
  },
  "http_code": 400
}
```
- Success event trigger log
```json
{
  "request_body": { 
    "email": "example@domain.com", 
    "password": "123456" 
  },
  "request_header": {
    "host": "127.0.0.1:36825",
    "accept-encoding": "gzip, deflate",
    "user-agent": "node-superagent/3.8.3",
    "content-type": "application/json",
    "content-length": "50",
    "connection": "close"
  },
  "trigger_name": null,
  "latency": 0,
  "level": "error",
  "message": "empty hasura event trigger id",
  "error":{
    "code": "validation_error",
    "details": null
  },
  "http_code": 400
}
```
- Failure event trigger log
```json
{
  "request_body": {
    "id": "2020-05-08T08:55:49.946Z",
    "event": { 
      "session_variables": { "x-hasura-role": "anonymous" },
      "op": "UPDATE", 
      "data": { "email": "example@domain.com", "password": "123456" } 
    },
    "created_at": "2020-05-08T08:55:49.946Z",
    "trigger": { "name": "update_user" },
    "table": { "name": "users", "schema": "public" }
  },
  "request_header": {
    "host": "127.0.0.1:35223",
    "accept-encoding": "gzip, deflate",
    "user-agent": "node-superagent/3.8.3",
    "content-type": "application/json",
    "content-length": "342",
    "connection": "close"
  },
  "trigger_name": "update_user",
  "latency": 1,
  "level": "info",
  "message": "executed trigger update_user successfully",
  "response": null,
  "http_code": 200
}
```

*Note*: request body and response data can be `null` by `withExpress` options

## Common Getters

### Action

```ts
// get action user ID
function getActionUserID(payload: HasuraActionPayload): string | null

// get action user role
function getActionUserRole(payload: HasuraActionPayload): string | null
```

### Event Trigger

```ts
// get event user ID
function getEventUserID(payload: HasuraEventPayload): string | null 

// get event user role
function getEventUserRole(payload: HasuraEventPayload): string | null
```
