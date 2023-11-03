import { PREFIX } from "../../config/commands.js";
import { ArgumentTypes, Command } from "../../lib/Command/Command.js";
import { TABLES } from "../../tables.js";
import { getRole, msToRelativeTime } from "../../utils";
import { Log } from "../models/Log";

const root = new Command({
  name: "log",
  description: "Manages the log command",
  requires: (player) => getRole(player) == "admin",
});

root
  .literal({
    name: "add",
    description: "Adds a new log",
  })
  .string("message")
  .executes((ctx, message) => {
    new Log({ message: message });
    ctx.sender.sendMessage(`§aAdded new log: ${message}`);
  });

root
  .literal({
    name: "getAll",
    description: "Gets all logs sorted in descending",
  })
  .int("page")
  .array("order", ["ascending", "descending"] as const)
  .executes((ctx, page, order) => {
    const allLogs = Object.entries(TABLES.logs.collection()).sort((a, b) =>
      order == "ascending"
        ? parseInt(b[0]) - parseInt(a[0])
        : parseInt(a[0]) - parseInt(b[0])
    );
    if (allLogs.length == 0) return ctx.sender.sendMessage(`§cNo Logs have been made!`);
    const maxPages = Math.ceil(allLogs.length / 8);
    if (page > maxPages) page = maxPages;
    ctx.sender.sendMessage(
      `§2--- Showing logs page ${page} of ${maxPages} (${PREFIX}log getAll <page: int>) ---`
    );

    for (const [key, value] of allLogs.slice(page * 8 - 8, page * 8)) {
      ctx.sender.sendMessage(`${msToRelativeTime(parseInt(key))}: ${value.message}`);
    }
  });

root
  .literal({
    name: "getPlayersLogs",
    description: "Gets all logs associated with a player",
  })
  .argument(new ArgumentTypes.playerName())
  .int("page")
  .array("order", ["ascending", "descending"] as const)
  .executes((ctx, playerName, page, order) => {
    const allLogs = Object.entries(TABLES.logs.collection())
      .filter((v) => v[1].playerName == playerName)
      .sort((a, b) =>
        order == "ascending"
          ? parseInt(b[0]) - parseInt(a[0])
          : parseInt(a[0]) - parseInt(b[0])
      );
    if (allLogs.length == 0)
      return ctx.sender.sendMessage(`§cNo Logs exists for "${playerName}"!`);
    const maxPages = Math.ceil(allLogs.length / 8);
    if (page > maxPages) page = maxPages;
    ctx.sender.sendMessage(
      `§2--- Showing logs for "${playerName}" page ${page} of ${maxPages} ---`
    );

    for (const [key, value] of allLogs.slice(page * 8 - 8, page * 8)) {
      ctx.sender.sendMessage(`${msToRelativeTime(parseInt(key))}: ${value.message}`);
    }
  });

root
  .literal({
    name: "getProtectionLogs",
    description: "Gets all logs associated with a protection",
  })
  .string("protection")
  .int("page")
  .array("order", ["ascending", "descending"] as const)
  .executes((ctx, protection, page, order) => {
    const allLogs = Object.entries(TABLES.logs.collection())
      .filter((v) => v[1].protection == protection)
      .sort((a, b) =>
        order == "ascending"
          ? parseInt(b[0]) - parseInt(a[0])
          : parseInt(a[0]) - parseInt(b[0])
      );
    if (allLogs.length == 0)
      return ctx.sender.sendMessage(`§cNo Logs exists for protection: "${protection}"!`);
    const maxPages = Math.ceil(allLogs.length / 8);
    if (page > maxPages) page = maxPages;
    ctx.sender.sendMessage(
      `§2--- Showing logs for Protection: "${protection}" page ${page} of ${maxPages} ---`
    );

    for (const [key, value] of allLogs.slice(page * 8 - 8, page * 8)) {
      ctx.sender.sendMessage(`${msToRelativeTime(parseInt(key))}: ${value.message}`);
    }
  });

root
  .literal({
    name: "clearAll",
    description: "Clears all logs",
  })
  .executes((ctx) => {
    TABLES.logs.clear();
    ctx.sender.sendMessage(`§aCleared All logs!`);
  });
