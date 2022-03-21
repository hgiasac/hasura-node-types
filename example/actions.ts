import {
  HasuraActionExpressHandler,
  withExpress,
  HasuraActionPayload,
} from "../src";

/* eslint-disable @typescript-eslint/indent */
const ACTION_LOGIN = "login";

type LoginInput = {
  readonly email: string;
  readonly password: string;
};

type LoginOutput = LoginInput;

const loginAction: HasuraActionExpressHandler<
  HasuraActionPayload<LoginInput, typeof ACTION_LOGIN>,
  LoginOutput
> = (ctx, { input }) => {
  ctx.logger.info("login data: ", input);

  return Promise.resolve({
    ...input,
    test: "fa",
  });
};

const handlerMap = {
  [ACTION_LOGIN]: loginAction,
};

export default withExpress().useActions(handlerMap);
