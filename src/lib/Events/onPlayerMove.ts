import { Dimension, Player, Vector3, world } from "@minecraft/server";
import { PlayerLog } from "../../plugins/Anti-Cheat/modules/models/PlayerLog";

type onPlayerMoveCallback = (player: Player, data: locationLog) => void;

const CALLBACKS: {
  [key: number]: {
    callback: onPlayerMoveCallback;
  };
} = {};

interface locationLog {
  /**
   * The Location this is
   */
  location: Vector3;
  /**
   * The dimension this location was in
   */
  dimension: Dimension;
  /**
   * The world tick this location log was set on
   */
  tickSet: number;
}

/**
 * Stores Last Previous grounded location
 */
export const playerLocation = new PlayerLog<locationLog>();

world.events.tick.subscribe((data) => {
  const sendCallback = (player: Player, data: locationLog) => {
    for (const callback of Object.values(CALLBACKS)) {
      callback.callback(player, data);
    }
  };
  for (const player of world.getPlayers()) {
    const oldLocation = playerLocation.get(player);
    if (oldLocation) {
      if (player.location == oldLocation?.location) {
        continue;
      }
    }
    playerLocation.set(player, {
      location: player.location,
      dimension: player.dimension,
      tickSet: data.currentTick,
    });
    if (!oldLocation) continue;
    sendCallback(player, oldLocation);
  }
});

export class onPlayerMove {
  /**
   * Subscribes to a callback to get notified when a player moves
   * @param callback what to be called when one of these entity's inventory changes
   * @returns the id that is used to unsubscribe
   */
  static subscribe(callback: onPlayerMoveCallback): number {
    const key = Date.now();
    CALLBACKS[key] = { callback: callback };
    return key;
  }
  static unsubscribe(key: number): void {
    delete CALLBACKS[key];
  }
}
