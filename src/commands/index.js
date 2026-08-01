import * as verify from "./verify.js";
import * as status from "./status.js";
import * as admin from "./admin.js";

export const commands = new Map([
  [verify.data.name, verify],
  [status.data.name, status],
  [admin.data.name, admin]
]);

export const commandJson = [...commands.values()].map(
  (command) => command.data.toJSON()
);
