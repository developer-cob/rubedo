import {
  BlockType,
  Entity,
  GameMode,
  MinecraftDimensionTypes,
  Player,
  system,
  Vector,
  Vector3,
  world,
} from "@minecraft/server";
import type { ConfigType, ROLES } from "./types";
import { Region } from "./modules/models/Region.js";
import { ChangePlayerRoleTask } from "./modules/models/Task";
import { APPEAL_LINK, BANNED_BLOCKS, BANNED_ITEMS } from "./config/moderation";
import { TABLES } from "./tables";
import { ENCHANTMENTS } from "./config/enchantments";

/**
 * This is to reduce lag when grabbing dimensions keep them set and pre-defined
 */
export const DIMENSIONS = {
  overworld: world.getDimension(MinecraftDimensionTypes.overworld),
  nether: world.getDimension(MinecraftDimensionTypes.nether),
  theEnd: world.getDimension(MinecraftDimensionTypes.theEnd),
  "minecraft:overworld": world.getDimension(MinecraftDimensionTypes.overworld),
  "minecraft:nether": world.getDimension(MinecraftDimensionTypes.nether),
  "minecraft:the_end": world.getDimension(MinecraftDimensionTypes.theEnd),
};

/**
 * Get score of an entity
 * @example getScore(Entity, 'Money');
 */
export function getScore(entity: Entity, objective: string): number {
  try {
    return world.scoreboard
      .getObjective(objective)
      .getScore(entity.scoreboardIdentity);
  } catch (error) {
    return 0;
  }
}

/**
 * sets the score of a name
 * @example setScore("Smell of curry", 'Money');
 */
export function setScore(
  entityName: string,
  objective: string,
  value: Number
): void {
  try {
    DIMENSIONS.overworld.runCommandAsync(
      `scoreboard players set "${entityName}" ${objective} ${value}`
    );
  } catch (error) {
    console.warn(error + error.stack);
  }
}

/**
 * Duration converter
 * @param duration time to convert
 * @example ```
 * durationToMs("10s")
 * durationToMs("10d,2y")
 * durationToMs("5m")
 * durationToMs("23ms,10s")
 * ```
 */
const durations: { [unit: string]: number } = {
  y: 3.17098e-11,
  w: 6.048e8,
  d: 8.64e7,
  h: 3.6e6,
  m: 60000,
  s: 1000,
  ms: 1,
};

export function durationToMs(duration: string): number {
  const values: string[] = duration.split(",");
  let ms = 0;
  for (const value of values) {
    const length = parseInt(value.match(/\d+/)[0]);
    const unit = value.match(/[a-zA-Z]+/)[0];
    if (!durations[unit]) {
      throw new Error(`Invalid duration unit: ${unit}`);
    }
    ms += durations[unit] * length;
  }
  return ms;
}

/**
 * Convert a number of milliseconds to a human-readable relative time string.
 * @param {number} timeInMilliseconds - The number of milliseconds to convert.
 * @returns {string} The relative time string (e.g. "3 days ago", "1 hour ago", "30 seconds ago", etc.).
 */
export function msToRelativeTime(timeInMilliseconds: number): string {
  const now = new Date().getTime();
  const timeDifference = timeInMilliseconds - now;
  const timeDifferenceAbs = Math.abs(timeDifference);

  const millisecondsInSecond = 1000;
  const millisecondsInMinute = 60 * millisecondsInSecond;
  const millisecondsInHour = 60 * millisecondsInMinute;
  const millisecondsInDay = 24 * millisecondsInHour;

  const days = Math.floor(timeDifferenceAbs / millisecondsInDay);
  const hours = Math.floor(
    (timeDifferenceAbs % millisecondsInDay) / millisecondsInHour
  );
  const minutes = Math.floor(
    (timeDifferenceAbs % millisecondsInHour) / millisecondsInMinute
  );
  const seconds = Math.floor(
    (timeDifferenceAbs % millisecondsInMinute) / millisecondsInSecond
  );

  if (timeDifference >= 0) {
    // Future time
    if (days > 0) {
      return `in ${days} day${days > 1 ? "s" : ""}`;
    } else if (hours > 0) {
      return `in ${hours} hour${hours > 1 ? "s" : ""}`;
    } else if (minutes > 0) {
      return `in ${minutes} minute${minutes > 1 ? "s" : ""}`;
    } else {
      return `in ${seconds} second${seconds > 1 ? "s" : ""}`;
    }
  } else {
    // Past time
    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else {
      return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
    }
  }
}

/**
 * Sleeps your code
 * @param {number} tick time in ticks you want the return to occur
 * @returns {Promise<void>}
 */
export function sleep(tick: number): Promise<void> {
  return new Promise((resolve) => {
    system.runTimeout(() => {
      resolve();
    }, tick);
  });
}

/**
 * Sorts 3D vectors to a min and max vector
 * @param vector1
 * @param vector2
 * @returns {[Vector3, Vector3]}
 */
export function sort3DVectors(
  vector1: Vector3,
  vector2: Vector3
): [Vector3, Vector3] {
  [vector1.x, vector2.x] = [
    Math.min(vector1.x, vector2.x),
    Math.max(vector1.x, vector2.x),
  ];
  [vector1.y, vector2.y] = [
    Math.min(vector1.y, vector2.y),
    Math.max(vector1.y, vector2.y),
  ];
  [vector1.z, vector2.z] = [
    Math.min(vector1.z, vector2.z),
    Math.max(vector1.z, vector2.z),
  ];
  return [vector1, vector2];
}
/**
 * Checks if a target vector is between two vectors
 * @param target
 * @param vector1
 * @param vector2
 * @returns
 */
export function betweenVector3(
  target: Vector3,
  vector1: Vector3,
  vector2: Vector3
): boolean {
  const [minVector, maxVector] = sort3DVectors(vector1, vector2);
  const { x, y, z } = target;
  return (
    x >= minVector.x &&
    x <= maxVector.x &&
    y >= minVector.y &&
    y <= maxVector.y &&
    z >= minVector.z &&
    z <= maxVector.z
  );
}

/**
 * Splits a string into chunk sizes
 */
export function chunkString(str: string, length: number): string[] {
  return str.match(new RegExp(".{1," + length + "}", "g"));
}

/**
 * Splits a string into an array of arrays of strings with a maximum length of 32767 characters per string in the innermost array.
 * @param str The input string to split.
 * @param maxLength Max Length of the 1st array
 * @param subArraysMaxLength Max Length of the strings in the 2d array
 * @returns A two-dimensional array of strings, where each inner array has a maximum length of 2147483647.
 */
export function splitString(
  str: string,
  maxLength: number,
  subArraysMaxLength: number
): string[][] {
  const subStrings: string[] = [];
  for (let i = 0; i < str.length; i += maxLength) {
    subStrings.push(str.slice(i, i + maxLength));
  }

  const subArrays: string[][] = [];
  for (const subString of subStrings) {
    subArrays.push(
      Array.from(
        { length: Math.ceil(subString.length / subArraysMaxLength) },
        (_, i) =>
          subString.slice(i * subArraysMaxLength, (i + 1) * subArraysMaxLength)
      )
    );
  }

  return subArrays;
}

/**
 * Kicks a player
 * @param player player who should be kicked
 * @param message the message that should be show to player
 * @param onFail this needs to be used for loops to unregister
 */
export function kick(
  player: Player,
  message: Array<String> = [],
  onFail?: () => void
): void {
  if (isServerOwner(player)) {
    console.warn(`[WARNING]: TRIED TO KICK OWNER`);
    player.sendMessage(`You have been tried to kick, but you cant!`);
    return onFail?.();
  }
  try {
    player.runCommandAsync(`kick "${player.name}" §r${message.join("\n")}`);
    player.triggerEvent("kick");
  } catch (error) {
    player.triggerEvent("kick");
    if (!/"statusCode":-2147352576/.test(error)) return;
    // This function just tried to kick the owner
    if (onFail) onFail();
  }
}

/**
 * Gets the role of this player
 * @param player player to get role from
 * @example getRole("Smell of curry")
 */
export function getRole(player: Player | string): keyof typeof ROLES {
  if (player instanceof Player) {
    return TABLES.roles.get(player.name) ?? "member";
  } else {
    return TABLES.roles.get(player) ?? "member";
  }
}

/**
 * Sets the role of this player
 * @example setRole("Smell of curry", "admin")
 */
export function setRole(
  player: Player | string,
  value: keyof typeof ROLES
): void {
  if (typeof player == "string") {
    // we need to create a task that will update the role for
    // that player when they join
    // also we need to set there db_role back
    TABLES.roles.set(player, value);
    /**
     * If the player is in the game just set it now
     * if they are not in the game we will need to create a task
     * to set there role when they join
     */
    const inGamePlayer = [...world.getPlayers()].find((p) => p.name == player);
    if (inGamePlayer) {
      inGamePlayer.setDynamicProperty("role", value);
    } else {
      new ChangePlayerRoleTask(player, value);
    }
  } else {
    // just change both of them no need for task
    TABLES.roles.set(player.name, value);
    player.setDynamicProperty("role", value);
  }
}

/**
 * Checks if a player is the owner of this world that was set using `/function`
 * @param player player to test
 * @returns if player is owner
 */
export function isServerOwner(player: Player): boolean {
  return world.getDynamicProperty("worldsOwner") == player.id;
}

/**
 * Gets the server owner
 * @returns server owners id
 */
export function getServerOwner(): string | null {
  const id = world.getDynamicProperty("worldsOwner") as string;
  if (!id || id == "") return null;
  return id;
}

/**
 * Gets the server owners name
 * @returns server owners name
 */
export function getServerOwnerName(): string | null {
  const ownerId = getServerOwner();
  if (!ownerId) return null;
  const ids = TABLES.ids.collection();
  return Object.keys(ids).find((key) => ids[key] === ownerId);
}

/**
 * Sets the server owner
 * @param player player to set the server owner too
 */
export function setServerOwner(player: Player) {
  if (!player) return world.setDynamicProperty("worldsOwner", "");
  world.setDynamicProperty("worldsOwner", player.id.toString());
}

/**
 * Checks if the server is locked down
 */
export function isLockedDown(): boolean {
  return (world.getDynamicProperty("isLockDown") ?? false) as boolean;
}

/**
 * Sets the server's lock down status
 * @param val if the server is locked down or not
 */
export function setLockDown(val: boolean) {
  world.setDynamicProperty("isLockDown", val);
}

/**
 * Calculates all the vectors between two 3D vectors.
 *
 * @param startVector - The starting vector.
 * @param endVector - The ending vector.
 * @param step - The step size for interpolation (between 0 and 1).
 * @returns An array of 3D vectors between the start and end vectors.
 */
function interpolateVectors(
  startVector: Vector3,
  endVector: Vector3,
  step: number = 1
): Vector3[] {
  if (step <= 0 || step > 1) {
    throw new Error(
      "Step size must be between 0 (exclusive) and 1 (inclusive)."
    );
  }

  const interpolatedVectors: Vector3[] = [];

  for (let t = 0; t <= 1; t += step) {
    const x = startVector.x + t * (endVector.x - startVector.x);
    const y = startVector.y + t * (endVector.y - startVector.y);
    const z = startVector.z + t * (endVector.z - startVector.z);

    interpolatedVectors.push({ x, y, z });
  }

  return interpolatedVectors;
}

/**
 * Sets Deny blocks at bottom of region every 5 mins
 */
export function fillBlocksBetween(blockType: BlockType | string) {
  for (const region of Region.getAllRegions()) {
    const loc1 = new Vector(
      region.from.x,
      region.dimensionId == "minecraft:overworld" ? -64 : 0,
      region.from.z
    );
    const loc2 = new Vector(
      region.to.x,
      region.dimensionId == "minecraft:overworld" ? -64 : 0,
      region.to.z
    );
    for (const blockLocation of interpolateVectors(loc1, loc2)) {
      const block =
        DIMENSIONS[region.dimensionId as keyof typeof DIMENSIONS].getBlock(
          blockLocation
        );
      if (!block) continue;
      block.setType(blockType);
    }
  }
}

/**
 * Grabs config data from the database
 * @param id id to grab
 */
export function getConfigId<T extends keyof ConfigType>(id: T): ConfigType[T] {
  switch (id) {
    case "banned_items":
      return TABLES.config.get("banned_items") ?? BANNED_ITEMS;
    case "banned_blocks":
      return TABLES.config.get("banned_blocks") ?? BANNED_BLOCKS;
    case "enchantments":
      return TABLES.config.get("enchantments") ?? ENCHANTMENTS;
    case "appealLink":
      return TABLES.config.get("appealLink") ?? APPEAL_LINK;
  }
}

/**
 * Sets a config id
 * @param key key to set
 * @param value value to set key to
 */
export function setConfigId<T extends keyof ConfigType>(
  key: T,
  value: ConfigType[T]
) {
  TABLES.config.set(key, value);
}

/**
 * Gets the Gamemode of a player
 * @param {Player} player player to get
 * @returns {keyof typeof GameMode}
 * @example if (getGamemode(player) == "creative") return;
 */
export function getGamemode(player: Player): GameMode {
  return (
    Object.values(GameMode).find(
      (g) => [...world.getPlayers({ name: player.name, gameMode: g })].length
    ) || GameMode.survival
  );
}

/**
 * Freezes a player in the moment
 * @param player
 */
export function freezePlayer(player: Player) {
  player.runCommand(`inputpermission set @s movement disabled`);
}
