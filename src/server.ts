import "./utils/module-alias";

import { createServer, type Server } from "node:http";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { json } from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import depthLimit from "graphql-depth-limit";
import { applyMiddleware } from "graphql-middleware";
import type { GraphQLContext } from "interfaces/graphql-context";
import { servicePermissions } from "permissions";
import schema from "schema";

import { authenticateSession } from "schema/auth/services";

import { cirkleLogger, logger } from "utils/logger";
import { generateReferenceId, resolveClientIp } from "utils/misc";

import { mountGraphqlSse } from "./graphql-sse-handler";

dotenv.config();
const { PORT, NODE_ENV, API_BASE_URL } = process.env;

const app = express();

app.set("trust proxy", true);

app.use(cors());
app.use(
  express.urlencoded({
    limit: "50mb",
    parameterLimit: 100000,
    extended: true,
  }),
);
app.use(
  express.json({
    limit: "50mb",
  }),
);

app.get("/health", (_, res) => res.sendStatus(200));

const startServer = async () => {
  const server = new ApolloServer({
    schema: applyMiddleware(schema, servicePermissions),
    introspection: NODE_ENV !== "PROD",
    plugins: [cirkleLogger],
    validationRules: [depthLimit(10)],
    formatError: (formattedError) => {
      return {
        code: formattedError.extensions?.code,
        message: formattedError.message,
        meta: formattedError.extensions?.meta,
      };
    },
  });

  await server.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<GraphQLContext> => {
        const session = await authenticateSession(req);
        return session
          ? {
              requestId: generateReferenceId(4),
              isAuthenticated: true,
              ...session,
              userAgent: req.headers["user-agent"],
              ipAddress: resolveClientIp(req),
            }
          : {
              requestId: generateReferenceId(4),
              isAuthenticated: false,
              userAgent: req.headers["user-agent"],
              ipAddress: resolveClientIp(req),
            };
      },
    }),
  );

  mountGraphqlSse(app);
};

const start = async (): Promise<void> => {
  await startServer();

  const port = Number(PORT || 8081);
  const host = API_BASE_URL || "http://localhost:8081";

  const server: Server = createServer(app);

  server.listen(port, () => {
    logger.info(`Server running in ${NODE_ENV} mode on ${host}/graphql`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`);

    server.close(async () => {
      logger.info("HTTP server closed");
      process.exit(0);
    });

    setTimeout(() => {
      logger.error("Forced shutdown — timed out after 10 s");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

process.on("unhandledRejection", (reason: unknown) => {
  logger.error("Unhandled Rejection", { reason });
});

process.on("uncaughtException", (err: Error) => {
  logger.error("Uncaught Exception", { error: err });
  process.exit(1);
});

start().catch((err: Error) => {
  logger.error("Failed to start server", { error: err });
  process.exit(1);
});
