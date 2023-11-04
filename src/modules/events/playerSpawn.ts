import { world } from "@minecraft/server";
import { TABLES } from "../../tables.js";
import { getRole, isLockedDown, kick, setRole } from "../../utils";
import { Mute } from "../models/Mute";
import { ChangePlayerRoleTask } from "../models/Task";
import { text } from "../../lang/text.js";
import { Log } from "../models/Log.js";

world.afterEvents.playerSpawn.subscribe(({ player }) => {
  TABLES.ids.onLoad(() => {
    if (isLockedDown() && getRole(player) != "admin")
      return kick(player, text["lockdown.kick.message"]());
    // --
    if (Mute.getMuteData(player))
      player.runCommandAsync(`ability @s mute true`);
    if (!TABLES.ids.has(player.name)) {
      // Player is new!
      TABLES.ids.set(player.name, player.id);
      new Log({
        message: `New Player: ${player.name}, Joined the World.`,
        playerName: player.name,
      });
    }
    /**
     * This is a role that was tried to push when the player was offline
     * so were setting it now because the player just joined
     */
    const roleToSet = ChangePlayerRoleTask.getPlayersRoleToSet(player.name);
    if (roleToSet) setRole(player, roleToSet);
  });
});
