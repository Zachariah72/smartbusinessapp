import { createServer } from "node:http";
import type { Server } from "node:http";
import { handleRequest } from "../api/router";

export interface AppContext {
  server: Server;
}

export const createApp = (): AppContext => {
  const server = createServer((req, res) => {
    void handleRequest(req, res);
  });
  return { server };
};
