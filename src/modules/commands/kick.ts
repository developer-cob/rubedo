import { ArgumentTypes, Command } from "../../lib/Command/Command";
import { getRole, kick } from "../../utils";
import { Log } from "../models/Log";

new Command({
  name: "kick",
  description: "Kicks a player from the game",
  requires: (player) => getRole(player) == "admin",
})
  .argument(new ArgumentTypes.player())
  .string("reason")
  .executes((ctx, player, reason) => {
    kick(player, [reason]);
    ctx.sender.sendMessage(`§aKicked ${player.name} from the world`);
    new Log({
      message: `${ctx.sender.name}'s Kicked: ${player.name} from the world. Because: ${reason}.`,
      playerName: player.name,
    });
  });
