import { Entity, ItemStack } from "@minecraft/server";
import { DIMENSIONS } from "../utils";
import { MinecraftItemTypes } from "../config/vanilla-data/mojang-item";

/**
 * Where the entity is going to be at
 */
const ENTITY_LOCATION = { x: 0, y: 0, z: 0 };

const ENTITY_DATABASE_ID = "rubedo:inventory";

export class ItemDatabase {
  TABLE_NAME: string;
  /**
   * The name of the table
   * @param {String} TABLE_NAME
   */
  constructor(TABLE_NAME: string) {
    this.TABLE_NAME = TABLE_NAME;
  }

  /**
   * Grabs all database entities
   * @returns {Array<Entity>}
   */
  get ENTITIES(): Array<Entity> {
    return [
      ...DIMENSIONS.overworld.getEntities({
        type: ENTITY_DATABASE_ID,
        location: ENTITY_LOCATION,
        tags: [this.TABLE_NAME],
      }),
    ];
  }

  /**
   * Returns all items that are stored
   */
  get ITEMS(): Array<ItemStack> {
    let ITEMS = [];
    for (const entity of this.ENTITIES) {
      const inv = entity.getComponent("minecraft:inventory").container;
      for (let i = 0; i < inv.size; i++) {
        const item = inv.getItem(i);
        if (!item) continue;
        ITEMS.push(item);
      }
    }
    return ITEMS;
  }

  /**
   * Gets a item by id from inv
   */
  get(id: string) {
    const item = this.ITEMS.find((item) => item.getLore().includes(id));
    if (!item) return null;
    const lore = item.getLore();
    lore.pop();
    if (lore.length == 0) lore.push("");
    item.setLore(lore);
    return item;
  }

  /**
   * Saves a item to the database
   */
  add(item: ItemStack): string {
    let entity = null;
    for (const e of this.ENTITIES) {
      const inv = e.getComponent("minecraft:inventory").container;
      if (inv.emptySlotsCount > 0) {
        entity = e;
        break;
      }
    }
    if (!entity) {
      try {
        entity = DIMENSIONS.overworld.spawnEntity(
          ENTITY_DATABASE_ID,
          ENTITY_LOCATION
        );
      } catch (error) {
        console.warn(error + error.stack);
      }
    }
    try {
      entity.addTag(this.TABLE_NAME);
    } catch (error) {}

    const inv = entity.getComponent("minecraft:inventory").container;
    const ID = Date.now();
    let lore = item.getLore() ?? [];
    lore.push(`${ID}`);
    item.setLore(lore);
    inv.addItem(item);
    return `${ID}`;
  }

  /**
   * deletes a item from the chests
   * @param {string} id
   * @returns {Boolean} If it deleted or not
   */
  delete(id: string): Boolean {
    for (const entity of this.ENTITIES) {
      const inv = entity.getComponent("minecraft:inventory").container;
      for (let i = 0; i < inv.size; i++) {
        const item = inv.getItem(i);
        if (!item || !item.getLore().includes(id)) continue;
        inv.setItem(i, new ItemStack(MinecraftItemTypes.AcaciaBoat, 0));
        return true;
      }
    }
    return false;
  }

  /**
   * Clears All Saved Db items
   */
  clear() {
    for (const entity of this.ENTITIES) {
      entity.triggerEvent(`despawn`);
    }
  }
}
