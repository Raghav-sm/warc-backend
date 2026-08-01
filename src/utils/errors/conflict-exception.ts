import BaseGraphQLException, { type ErrorMeta } from "./base-graphql-exception";

class ConflictException extends BaseGraphQLException {
  constructor(message: string = "Conflict detected", code: string = "CONFLICT", meta?: ErrorMeta) {
    super(message, {
      code,
      status: 409,
      meta,
    });
  }
}

export default ConflictException;
