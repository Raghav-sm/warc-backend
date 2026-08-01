import winston from "winston";

import { formatBusinessDate } from "./date";

const logger = winston.createLogger({
  level: "info",
});

const logFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.align(),
  winston.format.printf((info) => {
    const level = info.level;
    const timestamp = formatBusinessDate(info.timestamp as string, "YYYY-MM-DD HH:mm:ss");
    const requestId = info.requestId || "N/A - Request Id";
    const operationName = info.operationName || "N/A - Operation Name";
    const message = info.message;
    const base = `${level} | ${timestamp} | ${requestId} | ${operationName} | ${message}`;

    const detail = info.error ?? info.reason;
    if (detail instanceof Error) return `${base}\n${detail.stack ?? `${detail.name}: ${detail.message}`}`;
    if (detail !== undefined) return `${base} | ${typeof detail === "string" ? detail : JSON.stringify(detail)}`;

    return base;
  }),
);

logger.add(
  new winston.transports.Console({
    format: logFormat,
  }),
);

const isIntrospectionRequest = (requestContext) => {
  const operationName = requestContext.request.operationName;
  const query = requestContext.request.query;

  return operationName === "IntrospectionQuery" || query?.includes("IntrospectionQuery");
};

const cirkleLogger = {
  // Fires whenever a GraphQL request is received from a client.
  async requestDidStart(requestContext) {
    if (isIntrospectionRequest(requestContext)) {
      return {};
    }

    logger.info("Request started", {
      requestId: requestContext.contextValue.requestId,
      operationName: requestContext.request.operationName,
    });

    return {
      async didEncounterErrors(requestContext) {
        logger.error(`Exception on query : ${requestContext.request.query}`);
        logger.error(requestContext.errors, {
          requestId: requestContext.contextValue.requestId,
          operationName: requestContext.request.operationName,
        });
      },
      async willSendResponse(requestContext) {
        logger.info("Sending response", {
          requestId: requestContext.contextValue.requestId,
          operationName: requestContext.request.operationName,
        });
      },
    };
  },
};

export { cirkleLogger, logger };
