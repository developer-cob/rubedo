import { Dimension, Entity, Vector3 } from "@minecraft/server";
import { clearNpcLocations, NPC_LOCATIONS } from "../../index.js";
import { TABLES } from "../../tables.js";
import type { INpcLocation } from "../../types.js";

export class Npc {
  /**
   * Checks if a entity is a valid npc
   * @param entity npc
   */
  static isValid(entity: Entity): boolean {
    if (entity.typeId != "minecraft:npc") return false;
    if (NPC_LOCATIONS.find((l) => l == entity.location))
      return true;
    return TABLES.npcs.keys().find((key) => entity.id == key) ? true : false;
  }
  /**
   * Adds a new verified npc to the world
   */
  constructor(location: Vector3, dimension: Dimension) {
    NPC_LOCATIONS.push(location);
    const entity = dimension.spawnEntity("minecraft:npc", location);

    const data: INpcLocation = {
      dimension: entity.dimension.id,
      x: entity.location.x,
      y: entity.location.y,
      z: entity.location.z,
    };
    TABLES.npcs.set(entity.id, data);
    clearNpcLocations();
  }
}
