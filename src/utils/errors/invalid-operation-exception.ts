import BaseGraphQLException, { type ErrorMeta } from "./base-graphql-exception";

class InvalidOperationException extends BaseGraphQLException {
  constructor(message: string, code: string = "INVALID_OPERATION", meta?: ErrorMeta) {
    super(message, {
      code,
      status: 400,
      meta,
    });
  }
}

export default InvalidOperationException;
