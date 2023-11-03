import { text } from "../../lang/text.js";
import { CommandCallback } from "../../lib/Command/Callback.js";
import { ArgumentTypes, Command } from "../../lib/Command/Command.js";
import { confirmAction } from "../../lib/Form/utils.js";
import { TABLES } from "../../tables.js";
import { getRole, msToRelativeTime } from "../../utils.js";
import { Ban } from "../models/Ban.js";

function ban(
  ctx: CommandCallback,
  player: string,
  duration: string,
  reason: string,
  by: string
) {
  if (TABLES.bans.get(TABLES.ids.get(player)))
    return ctx.sender.sendMessage(`§c${player} is already banned`);
  ctx.sender.sendMessage(`§aClose chat to confirm`);
  confirmAction(
    ctx.sender,
    `Are you sure you want to ban ${player}, for ${duration ?? "forever"}`,
    () => {
      new Ban(player, duration, reason, ctx.sender.name);
      ctx.sender.sendMessage(
        text["modules.commands.ban.reply"](player, duration, reason)
      );
    }
  );
}

const root = new Command({
  name: "ban",
  description: "Manage bans",
  requires: (player) => ["admin", "moderator"].includes(getRole(player)),
});

root
  .literal({
    name: "add",
    description: "Bans a player",
  })
  .argument(new ArgumentTypes.playerName())
  .executes((ctx, player) => {
    ban(ctx, player, null, null, ctx.sender.name);
  })
  .argument(new ArgumentTypes.duration("duration"))
  .executes((ctx, player, duration) => {
    ban(ctx, player, duration, null, ctx.sender.name);
  })
  .string("reason")
  .executes((ctx, player, duration, reason) => {
    ban(ctx, player, duration, reason, ctx.sender.name);
  });

root
  .literal({
    name: "remove",
    description: "un-bans a player",
  })
  .argument(new ArgumentTypes.playerName("playerName"))
  .executes((ctx, playerName) => {
    const banData = TABLES.bans
      .values()
      .find((ban) => ban.playerName == playerName);
    if (!banData) return ctx.sender.sendMessage(`${playerName} is not banned`);
    if (TABLES.bans.delete(banData.key)) {
      ctx.sender.sendMessage(`§a${playerName}§r has been Unbanned!`);
    } else {
      ctx.sender.sendMessage(`§cFailed to un-ban ${playerName}`);
    }
  });

root
  .literal({
    name: "list",
    description: "Lists all bans",
  })
  .executes((ctx) => {
    const bans = TABLES.bans.values();
    if (bans.length == 0) return ctx.sender.sendMessage(`§cNo one is banned!`);
    ctx.sender.sendMessage(`§2--- Showing Bans (${bans.length}) ---`);
    for (const ban of bans) {
      ctx.sender.sendMessage(
        text["commands.ban.list.player"](
          ban.playerName,
          ban.reason,
          ban.expire ? msToRelativeTime(ban.duration) : "Forever"
        )
      );
    }
  });
