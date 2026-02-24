import { clientsRules } from "./rules";

export const clientsService = {
  get: async () => ({ module: "clients", rules: clientsRules.version }),
};
