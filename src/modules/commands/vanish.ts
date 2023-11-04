import { Player, world } from "@minecraft/server";
import { getRole } from "../../utils.js";
import { Command } from "../../lib/Command/Command.js";
import { Log } from "../models/Log.js";

function vanish(player: Player, say: boolean) {
  if (player.hasTag(`spectator`)) {
    player.runCommandAsync(`gamemode c`);
    player.triggerEvent(`removeSpectator`);
    player.removeTag(`spectator`);
    if (!say) return;
    world.sendMessage({
      rawtext: [
        {
          translate: "multiplayer.player.joined",
          with: [`§e${player.name}`],
        },
      ],
    });
  } else {
    player.runCommandAsync(`gamemode spectator`);
    player.triggerEvent(`addSpectator`);
    player.addTag(`spectator`);
    if (!say) return;
    world.sendMessage({
      rawtext: [
        {
          translate: "multiplayer.player.left",
          with: [`§e${player.name}`],
        },
      ],
    });
  }
}

new Command({
  name: "vanish",
  description: "Toggles Vanish Mode on the sender",
  requires: (player) => getRole(player) == "admin",
})
  .executes((ctx) => {
    vanish(ctx.sender, false);
    new Log({
      message: `${ctx.sender.name} vanished.`,
      playerName: ctx.sender.name,
    });
  })
  .boolean("say")
  .executes((ctx, say) => {
    vanish(ctx.sender, say);
    new Log({
      message: `${ctx.sender.name} vanished, hidden: ${say}.`,
      playerName: ctx.sender.name,
    });
  });
