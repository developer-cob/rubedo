import { Player } from "@minecraft/server";
import { TABLES } from "../../tables.js";
import type { IFreezeData } from "../../types.js";

export class Freeze {
  /**
   * Freeze a player
   */
  constructor(player: Player, reason: string = "No Reason") {
    const location = player.location;
    const data: IFreezeData = {
      playerName: player.name,
      key: player.id,
      reason: reason,
      location: {
        x: location.x,
        y: location.y,
        z: location.z,
        dimension: player.dimension.id,
      },
    };
    TABLES.freezes.set(player.id, data);
  }
}
