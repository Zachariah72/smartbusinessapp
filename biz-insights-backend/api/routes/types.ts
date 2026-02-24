import type { IncomingMessage, ServerResponse } from "node:http";

export interface RouteMatch {
  params: Record<string, string>;
}

export interface Route {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: RegExp;
  handler: (req: IncomingMessage, res: ServerResponse, match: RouteMatch) => Promise<void>;
}
