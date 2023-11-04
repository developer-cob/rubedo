import { Mute } from "../models/Mute.js";
import { getRole, msToRelativeTime } from "../../utils.js";
import { TABLES } from "../../tables.js";
import { ArgumentTypes, Command } from "../../lib/Command/Command.js";
import { text } from "../../lang/text.js";
import { Log } from "../models/Log.js";

const root = new Command({
  name: "mute",
  description: "Manage Mutes",
  requires: (player) => ["admin", "moderator"].includes(getRole(player)),
});

root
  .literal({
    name: "add",
    description: "Mutes a player",
  })
  .argument(new ArgumentTypes.player("player"))
  .argument(new ArgumentTypes.duration("duration"))
  .string("reason")
  .executes((ctx, player, duration, reason) => {
    new Mute(player, duration, reason, ctx.sender.name);
    ctx.sender.sendMessage(
      `§cMuted §f"§a${player.name}§f" §cfor ${duration} Because: "${reason}" §aSuccessfully`
    );
    player.sendMessage(
      `§cYou have been muted by §f"${ctx.sender.name}" §cfor ${duration} Because: "${reason}"`
    );
    new Log({
      message: `${ctx.sender.name}'s Muted: ${player.name}. Because: ${reason}.`,
      playerName: player.name,
    });
  });

root
  .literal({
    name: "remove",
    description: "un-mutes a player",
  })
  .argument(new ArgumentTypes.playerName("playerName"))
  .executes((ctx, playerName) => {
    const mute = TABLES.mutes
      .values()
      .find((mute) => mute.playerName == playerName);
    if (!mute) return ctx.sender.sendMessage(`${playerName} is not muted!`);

    TABLES.mutes.delete(mute.playerName);
    try {
      ctx.sender.runCommandAsync(`ability "${playerName}" mute false`);
    } catch (error) {
      console.warn(
        `[Warning]: Command '-mute' Cannot fully proceed because command 'ability' does not exist! Please enable Education Edition!`
      );
    }
    ctx.sender.sendMessage(`§a${playerName}§r has been UnMuted!`);
    new Log({
      message: `${ctx.sender.name}'s Un-Muted: ${playerName}.`,
      playerName: playerName,
    });
  });

root
  .literal({
    name: "list",
    description: "Lists all freezes",
  })
  .executes((ctx) => {
    const mutes = TABLES.mutes.values();
    if (mutes.length == 0) return ctx.sender.sendMessage(`§cNo one is muted!`);
    ctx.sender.sendMessage(`§2--- Showing Mutes (${mutes.length}) ---`);
    for (const mute of mutes) {
      ctx.sender.sendMessage(
        text["commands.mutes.list.player"](
          mute.playerName,
          mute.reason,
          mute.expire ? msToRelativeTime(mute.expire) : "Forever"
        )
      );
    }
  });
