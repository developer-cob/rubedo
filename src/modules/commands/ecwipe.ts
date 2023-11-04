import { ArgumentTypes, Command } from "../../lib/Command/Command.js";
import { getRole } from "../../utils.js";
import { Log } from "../models/Log.js";

new Command({
  name: "ecwipe",
  description: "Clears a players ender chest",
  requires: (player) => getRole(player) == "admin",
})
  .argument(new ArgumentTypes.player("player"))
  .executes((ctx, player) => {
    for (let i = 0; i < 27; i++) {
      player.runCommandAsync(`replaceitem entity @s slot.enderchest ${i} air`);
    }
    ctx.sender.sendMessage(`§aCleared "${player.name}"'s Ender chest!`);
    new Log({
      message: `${ctx.sender.name}'s wiped ${player.name}'s Ender Chest!`,
      playerName: player.name,
    });
  });
