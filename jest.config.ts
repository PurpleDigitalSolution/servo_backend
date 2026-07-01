import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",

  testEnvironment: "node",

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
      },
    ],
  },

  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
  clearMocks: true,
};

export default config;
