import BaseGraphQLException, { type ErrorMeta } from "./base-graphql-exception";

class ValidationException extends BaseGraphQLException {
  constructor(message: string = "Invalid input", code: string = "BAD_USER_INPUT", meta?: ErrorMeta) {
    super(message, {
      code,
      status: 400,
      meta,
    });
  }
}

export default ValidationException;
