import { UserEntry } from "@lensjs/core";
import {
  ExpressAdapterConfig,
  RequiredExpressAdapterConfig,
} from "@lensjs/express";
import { INestApplication } from "@nestjs/common";

export type NestAdapter = "express" | "fastify";

export type NestLensConfig = {
  app: INestApplication;
  adapter?: NestAdapter;
  isAuthenticated?: (request: unknown) => Promise<boolean>;
  getUser?: (request: unknown) => Promise<UserEntry>;
} & Omit<ExpressAdapterConfig, "app">;

export type RequiredNestLensConfig = RequiredExpressAdapterConfig & {
  app: NestLensConfig["app"];
  adapter?: NestAdapter;
  isAuthenticated?: NestLensConfig["isAuthenticated"];
  getUser?: NestLensConfig["getUser"];
};
