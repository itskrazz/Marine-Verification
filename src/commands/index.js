import * as verify from "./verify.js";
import * as status from "./status.js";
import * as sync from "./sync.js";

export const commands = new Map([
  [verify.data.name, verify],
  [status.data.name, status],
  [sync.data.name, sync]
]);

export const commandData = [...commands.values()].map((command) =>
  command.data.toJSON()
);
