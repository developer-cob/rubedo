import { Command } from "../../lib/Command/Command";
import { confirmAction } from "../../lib/Form/utils";
import { TABLES } from "../../tables";

const root = new Command({
  name: "database",
  description: "Manages database",
  requires: (player) => player.isOp(),
});

root
  .literal({
    name: "reload",
    description: "Re-Grabs database data",
    requires: (player) => player.isOp(),
  })
  .executes((ctx) => {
    //Object.values(TABLES).forEach(d => d.fetchDatabase());
    ctx.sender.sendMessage(`Reloaded Database data!`);
  });

root
  .literal({
    name: "reset",
    description: "Resets all database data!",
    requires: (player) => player.isOp(),
  })
  .executes((ctx) => {
    ctx.sender.sendMessage(`§aClose chat to confirm Reset of database.`)
    confirmAction(
      ctx.sender,
      "Are you sure you want to reset all Database Data! This cannot be undone.",
      () => {
        Object.values(TABLES).forEach((t) => t.clear());
        ctx.sender.sendMessage("Reset All Database data!");
      }
    );
  });

root
  .literal({
    name: "resetTable",
    description: "Resets a given table!",
    requires: (player) => player.isOp(),
  })
  .array("table", Object.keys(TABLES) as readonly string[])
  .executes((ctx, table) => {
    confirmAction(
      ctx.sender,
      `Are you sure you want to reset all Database Data from table: ${table}! This cannot be undone.`,
      () => {
        TABLES[table as keyof typeof TABLES].clear();
        ctx.sender.sendMessage("Reset All Database data!");
      }
    );
  });

root
  .literal({
    name: "collection",
    description: "Grabs a collection from a given table!",
    requires: (player) => player.isOp(),
  })
  .array("table", Object.keys(TABLES) as readonly string[])
  .executes((ctx, table) => {
    const data = TABLES[table as keyof typeof TABLES].collection();
    ctx.sender.sendMessage(JSON.stringify(data));
  });

root
  .literal({
    name: "get",
    description: "Gets the value of a key on a given table.",
    requires: (player) => player.isOp(),
  })
  .array("table", Object.keys(TABLES) as readonly string[])
  .string("key")
  .executes((ctx, table, key) => {
    const value = TABLES[table as keyof typeof TABLES].get(key);
    ctx.sender.sendMessage(
      `Value for key: ${key}, on table: ${table}, is ${value}`
    );
  });

root
  .literal({
    name: "tableIds",
    description: "Returns a list of all the tableIds",
    requires: (player) => player.isOp(),
  })
  .executes((ctx) => {
    ctx.sender.sendMessage(
      `§aCurrent Table Ids:§r\n- ${Object.keys(TABLES).join("\n- ")}`
    );
  });
