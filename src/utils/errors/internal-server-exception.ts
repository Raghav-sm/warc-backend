import BaseGraphQLException, { type ErrorMeta } from "./base-graphql-exception";

class InternalServerException extends BaseGraphQLException {
  constructor(message: string = "Internal server error", code: string = "INTERNAL_SERVER_ERROR", meta?: ErrorMeta) {
    super(message, {
      code,
      status: 500,
      meta,
    });
  }
}

export default InternalServerException;
