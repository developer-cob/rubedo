import { world } from "@minecraft/server";
import { TABLES } from "../../tables.js";
import { kick, getConfigId, msToRelativeTime } from "../../utils.js";

world.afterEvents.playerSpawn.subscribe((data) => {
  TABLES.ids.onLoad(() => {
    const { player } = data;
    const banData = TABLES.bans.get(player.id);
    if (!banData) return;
    if (banData.expire && banData.expire < Date.now())
      return TABLES.bans.delete(player.id);
    kick(
      player,
      [
        `§cYou have been banned!`,
        `§aReason: §f${banData.reason}`,
        `§fExpiry: §b${
          banData.expire
            ? msToRelativeTime(banData.expire - Date.now())
            : "Forever"
        }`,
        `§fAppeal at: §b${getConfigId("appealLink")}`,
      ],
      () => {
        console.warn(new Error("Failed to kick player"));
        TABLES.bans.delete(player.id);
      }
    );
  });
});
