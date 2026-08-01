import BaseGraphQLException, { type ErrorMeta } from "./base-graphql-exception";

class NotFoundException extends BaseGraphQLException {
  constructor(resource: string = "Resource", identifier?: string, meta?: ErrorMeta) {
    super(`${resource}${identifier ? ` (${identifier})` : ""} not found`, {
      code: "RESOURCE_NOT_FOUND",
      status: 404,
      meta,
    });
  }
}

export default NotFoundException;
