import BaseGraphQLException, { type ErrorMeta } from "./base-graphql-exception";

class UnauthenticatedException extends BaseGraphQLException {
  constructor(message: string = "Authentication failed", code: string = "UNAUTHENTICATED", meta?: ErrorMeta) {
    super(message, {
      code,
      status: 401,
      meta,
    });
  }
}

export default UnauthenticatedException;
