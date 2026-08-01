import BaseGraphQLException, { type ErrorMeta } from "./base-graphql-exception";

class FailedOperationException extends BaseGraphQLException {
  constructor(message: string, code: string = "FAILED_OPERATION", meta?: ErrorMeta) {
    super(message, {
      code,
      status: 422,
      meta,
    });
  }
}

export default FailedOperationException;
