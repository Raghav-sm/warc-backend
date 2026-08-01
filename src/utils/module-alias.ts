import path from "node:path";
import { addAliases } from "module-alias";

function setupModuleAliases(): void {
  const isProduction = __dirname.includes("build");
  // In production: __dirname is build/src/utils, so go up one level to build/src
  // In dev: __dirname is the compiled location, go up to src
  const baseDir = isProduction
    ? path.join(__dirname, "..") // build/src/utils -> build/src
    : path.join(__dirname, "..", "..", "src");

  addAliases({
    cron: path.join(baseDir, "cron"),
    "prisma-client": path.join(baseDir, "../prisma/generated"),
    datasources: path.join(baseDir, "datasources"),
    interfaces: path.join(baseDir, "interfaces"),
    schema: path.join(baseDir, "schema"),
    utils: path.join(baseDir, "utils"),
    permissions: path.join(baseDir, "permissions"),
  });
}

setupModuleAliases();
