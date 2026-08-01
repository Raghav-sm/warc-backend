import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
  moduleNameMapper: {
    "^datasources/prisma$": "<rootDir>/src/utils/prisma-mock.ts",
    "^datasources/(.*)$": "<rootDir>/src/datasources/$1",
    "^interfaces/(.*)$": "<rootDir>/src/interfaces/$1",
    "^utils/(.*)$": "<rootDir>/src/utils/$1",
    "^schema$": "<rootDir>/src/schema/index.ts",
    "^schema/(.*)$": "<rootDir>/src/schema/$1",
    "^permissions$": "<rootDir>/src/permissions.ts",
    "^prisma-client/(.*)$": "<rootDir>/prisma/generated/$1",
  },
  modulePaths: ["<rootDir>/src"],
};

export default config;
