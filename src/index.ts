import { Vector3, system } from "@minecraft/server";
import { DynamicProperty } from "./lib/DynamicPropertyWrapper/DynamicProperty";
import "./lib/Command/index";
import "./modules/import"

export const database = new DynamicProperty<{ [key: string]: any }>(
  "db",
  "object"
).setWorldDynamic(true);

system.beforeEvents.watchdogTerminate.subscribe((data) => {
  data.cancel = true;
  console.warn(`WATCHDOG TRIED TO CRASH = ${data.terminateReason}`);
});


/**
 * Stores npc locations that are verified to allow NPC's to spawn in
 */
export let NPC_LOCATIONS: Array<Vector3> = [];

export function clearNpcLocations() {
  NPC_LOCATIONS = [];
}
