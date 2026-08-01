import BaseGraphQLException from "./base-graphql-exception";

class FileSizeLimitExceededException extends BaseGraphQLException {
  constructor(maxSize: string, actualSize?: string) {
    const message = actualSize
      ? `File size limit exceeded. Maximum allowed: ${maxSize}, actual: ${actualSize}`
      : `File size limit exceeded. Maximum allowed: ${maxSize}`;

    super(message, {
      code: "FILE_SIZE_LIMIT_EXCEEDED",
      status: 413,
      meta: {
        maxSize,
        ...(actualSize ? { actualSize } : {}),
      },
    });
  }
}

export default FileSizeLimitExceededException;
