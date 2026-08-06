import type { Express, Request, Response } from "express";
import { createHandler } from "graphql-sse/lib/use/express";

import schema from "schema";
import { authenticateSession } from "schema/auth/services";

import { UnauthenticatedException } from "utils/errors";
import { generateReferenceId, resolveClientIp } from "utils/misc";

type SseContext = {
  requestId: string;
  isAuthenticated: boolean;
  userId: string;
  roleId: string;
  permissions: string[];
  userAgent?: string;
  ipAddress?: string;
};

export function mountGraphqlSse(app: Express): void {
  const handler = createHandler({
    schema,
    context: async (req): Promise<SseContext> => {
      const expressReq = req.raw as Request;
      const session = await authenticateSession(expressReq);
      if (!session) {
        throw new UnauthenticatedException("User is not authenticated");
      }

      return {
        requestId: generateReferenceId(4),
        isAuthenticated: true,
        userId: session.userId,
        roleId: session.roleId,
        permissions: session.permissions,
        userAgent: req.headers.get("user-agent") ?? undefined,
        ipAddress: resolveClientIp(expressReq),
      };
    },
  });

  app.all("/graphql/stream", async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch {
      if (!res.headersSent) {
        res.status(500).end();
      }
    }
  });
}
