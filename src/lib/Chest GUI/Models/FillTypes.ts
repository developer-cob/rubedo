import { Entity, InventoryComponentContainer } from "mojang-minecraft";
import { AIR } from "../../../index.js";
import { Page } from "./Page.js";

export type FillTypeCallback = (
  entity: Entity,
  page: Page,
  extras: any
) => void;

/**
 * Fills a entity with desired itmes
 */
export function DefaultFill(entity: Entity, page: Page, extras: any) {
  const container = entity.getComponent("minecraft:inventory").container;
  for (let i = 0; i < container.size; i++) {
    const slot = page.slots[i];
    if (!slot || !slot.item) {
      container.setItem(i, AIR);
      continue;
    }
    container.setItem(i, slot.item.setComponents());
  }
}