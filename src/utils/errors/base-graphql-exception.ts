import { GraphQLError } from "graphql";

export type ErrorMeta = Record<string, unknown>;

type BaseGraphQLExceptionOptions = {
  code: string;
  status: number;
  meta?: ErrorMeta;
};

class BaseGraphQLException extends GraphQLError {
  constructor(message: string, options: BaseGraphQLExceptionOptions) {
    const { code, status, meta } = options;

    super(message, {
      extensions: {
        code,
        http: {
          status,
        },
        ...(meta ? { meta } : {}),
      },
    });

    this.name = new.target.name;
  }
}

export function isBaseGraphQLException(error: unknown): error is BaseGraphQLException {
  return error instanceof BaseGraphQLException;
}

export default BaseGraphQLException;
