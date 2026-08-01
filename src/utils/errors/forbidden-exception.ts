import BaseGraphQLException, { type ErrorMeta } from "./base-graphql-exception";

class ForbiddenException extends BaseGraphQLException {
  constructor(message: string = "Forbidden", code: string = "FORBIDDEN", meta?: ErrorMeta) {
    super(message, {
      code,
      status: 403,
      meta,
    });
  }
}

export default ForbiddenException;
