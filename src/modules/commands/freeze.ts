import { Freeze } from "../models/Freeze.js";
import { getRole } from "../../utils.js";
import { TABLES } from "../../tables.js";
import { ArgumentTypes, Command } from "../../lib/Command/Command.js";
import { text } from "../../lang/text.js";

const root = new Command({
  name: "freeze",
  description: "Manage Freezes",
  requires: (player) => ["admin", "moderator"].includes(getRole(player)),
});

root
  .literal({
    name: "add",
    description: "Freezes a player",
  })
  .argument(new ArgumentTypes.player("player"))
  .string("reason")
  .executes((ctx, player, reason) => {
    new Freeze(player, reason);
    ctx.sender.sendMessage(
      `§cFroze §f"§a${player.name}§f" Because: "${reason}" §aSuccessfully`
    );
    player.sendMessage(
      `§cYou have been frozen by §f"§a${ctx.sender.name}§f" Because: "${reason}"`
    );
  });

root
  .literal({
    name: "remove",
    description: "unfreezes a player",
  })
  .argument(new ArgumentTypes.playerName("playerName"))
  .executes((ctx, playerName) => {
    const freeze = TABLES.freezes
      .values()
      .find((freeze) => freeze.playerName == playerName);
    if (!freeze) return ctx.sender.sendMessage(`${playerName} is not frozen`);

    TABLES.freezes.delete(freeze.key);

    ctx.sender.sendMessage(`§a${playerName}§r has been UnFrozen!`);
  });

root
  .literal({
    name: "list",
    description: "Lists all freezes",
  })
  .executes((ctx) => {
    const freezes = TABLES.freezes.values();
    if (freezes.length == 0) return ctx.sender.sendMessage(`§cNo one is frozen!`);
    ctx.sender.sendMessage(`§2--- Showing Freezes (${freezes.length}) ---`);
    for (const freeze of freezes) {
      ctx.sender.sendMessage(
        text["commands.freeze.list.player"](freeze.playerName, freeze.reason)
      );
    }
  });
