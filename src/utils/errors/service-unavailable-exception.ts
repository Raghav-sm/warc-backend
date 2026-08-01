import BaseGraphQLException, { type ErrorMeta } from "./base-graphql-exception";

class ServiceUnavailableException extends BaseGraphQLException {
  constructor(
    message: string = "Service is currently unavailable. Please try again later.",
    code: string = "SERVICE_UNAVAILABLE",
    meta?: ErrorMeta,
  ) {
    super(message, {
      code,
      status: 503,
      meta,
    });
  }
}

export default ServiceUnavailableException;
