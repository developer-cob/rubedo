import { world } from "@minecraft/server";
import { getRole, isLockedDown, kick, setLockDown } from "../../utils.js";
import { Command } from "../../lib/Command/Command.js";
import { confirmAction } from "../../lib/Form/utils.js";
import { text } from "../../lang/text.js";

new Command({
  name: "lockdown",
  description: "Toggles the servers lockdown, meaning no one can join",
  requires: (player) => getRole(player) == "admin",
}).executes((ctx) => {
  if (isLockedDown()) {
    setLockDown(false);
    ctx.sender.sendMessage(`§aUnlocked the server!`);
  } else {
    ctx.sender.sendMessage(`§aClose chat to confirm lockdown`);
    confirmAction(ctx.sender, text["commands.lockdown.confirm"], () => {
      setLockDown(true);
      for (const player of world.getPlayers()) {
        if (getRole(player) == "admin") continue;
        kick(player, text["lockdown.kick.message"]());
      }
      world.sendMessage(`§l§cServer is now LOCKED!`);
    });
  }
});
