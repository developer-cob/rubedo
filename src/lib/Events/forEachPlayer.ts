import { Player, system, world } from "@minecraft/server";

const CALLBACKS: {
  [key: number]: {
    callback: (player: Player) => void;
    delay: number;
    lastCall: number;
  };
} = {};

system.runInterval(() => {
  const players = [...world.getPlayers()];
  const playerEntires = players.entries();
  for (const [i, player] of playerEntires) {
    const callbacks = Object.values(CALLBACKS);
    for (const CALLBACK of callbacks) {
      if (
        CALLBACK.delay != 0 &&
        system.currentTick - CALLBACK.lastCall < CALLBACK.delay
      )
        continue;
      CALLBACK.callback(player);
      if (i == players.length - 1) CALLBACK.lastCall = system.currentTick;
    }
  }
});

export class forEachPlayer {
  /**
   * Subscribes to a callback that returns every player
   * @param callback what to be called for each player
   * @returns the id that is used to unsubscribe
   */
  static subscribe(
    callback: (player: Player) => void,
    delay: number = 0
  ): number {
    const key = Object.keys(CALLBACKS).length;
    CALLBACKS[key] = { callback: callback, delay: delay, lastCall: 0 };
    return key;
  }
  static unsubscribe(key: number): void {
    delete CALLBACKS[key];
  }
}
