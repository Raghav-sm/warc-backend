import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { Pool } from "pg";
import { PrismaClient } from "prisma-client/client";
import { pagination } from "prisma-extension-pagination";

const createPrismaClient = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ["info"],
  }).$extends(
    pagination({
      pages: {
        limit: 10,
        includePageCount: true,
      },
    }),
  );
};

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

/** Client passed to interactive `prisma.$transaction(async tx => …)` (matches extended client + delegates). */
export type PrismaInteractiveTransactionClient = Parameters<Parameters<ExtendedPrismaClient["$transaction"]>[0]>[0];

let client: ExtendedPrismaClient | undefined;

export const getPrismaInstance = (): ExtendedPrismaClient => {
  if (!client) {
    client = createPrismaClient();
  }

  return client;
};
