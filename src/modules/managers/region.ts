import { Block, Entity, Player, system, world } from "@minecraft/server";
import { Region } from "../models/Region.js";
import { DIMENSIONS, fillBlocksBetween, getRole } from "../../utils.js";
import { BLOCK_CONTAINERS, DOORS_SWITCHES } from "../../config/region.js";
import { MinecraftBlockTypes } from "../../config/vanilla-data/mojang-block.js";
import { forEachPlayer } from "../../lib/Events/forEachPlayer.js";
import { TABLES } from "../../tables.js";
import { PlayerLog } from "../../database/PlayerLog.js";

/**
 * List of players that are on use cooldown
 */
let onUseDelay = new PlayerLog<number>();

/**
 * Sets Deny blocks at bottom of region every 5 mins
 */
system.runTimeout(() => {
  fillBlocksBetween(MinecraftBlockTypes.Deny);
}, 6000);

/**
 * Permissions for region
 */
world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
  const { player, block } = data;
  if (["moderator", "admin"].includes(getRole(player as Player))) return;
  if (player.isOp()) return;

  if (Date.now() - (onUseDelay.get(player) ?? 0) < 100) {
    data.cancel = true;
    return;
  }
  onUseDelay.set(player, Date.now());

  const region = Region.vectorInRegion(block.location, block.dimension.id);
  if (!region) return;
  if (
    DOORS_SWITCHES.includes(block.typeId) &&
    region.permissions.doorsAndSwitches
  )
    return;
  if (
    BLOCK_CONTAINERS.includes(block.typeId) &&
    region.permissions.openContainers
  )
    return;
  data.cancel = true;

  system.run(() => {
    if (!player.isValid()) return;
    player.playSound("note.bass");
    player.sendMessage("§cYou cannot interact with blocks in this region!");
  });
});

world.beforeEvents.playerPlaceBlock.subscribe((data) => {
  const { player, dimension, block } = data;
  if (["moderator", "admin"].includes(getRole(player as Player))) return;
  if (player.isOp()) return;

  const region = Region.vectorInRegion(block.location, dimension.id);
  if (!region) return;

  data.cancel = true;
  system.run(() => {
    if (!player.isValid()) return;
    player.playSound("note.bass");
    player.sendMessage(`§cYou cannot place blocks in this region!`);
  });
});

world.beforeEvents.playerBreakBlock.subscribe((data) => {
  const { player, dimension, block } = data;
  if (["moderator", "admin"].includes(getRole(player as Player))) return;
  if (player.isOp()) return;

  // Nuker Protection and Region protection in 1
  if (Date.now() - (onUseDelay.get(player) ?? 0) < 200) {
    data.cancel = true;
    return;
  }
  onUseDelay.set(player, Date.now());

  const region = Region.vectorInRegion(block.location, dimension.id);
  if (!region) return;

  data.cancel = true;
  system.run(() => {
    if (!player.isValid()) return;
    player.playSound("note.bass");
    player.sendMessage(`§cYou cannot break blocks in this region!`);
  });
});

world.beforeEvents.explosion.subscribe((data) => {
  const impactedBlocks = data.getImpactedBlocks();
  const allowedBlocks: Block[] = [];
  for (const block of impactedBlocks) {
    const region = Region.vectorInRegion(block.location, data.dimension.id);
    if (region) continue;
    allowedBlocks.push(block);
  }
  data.setImpactedBlocks(allowedBlocks);
});

world.afterEvents.entitySpawn.subscribe(async ({ entity }) => {
  const region = Region.vectorInRegion(entity.location, entity.dimension.id);
  if (!region) return;
  if (region.permissions.allowedEntities.includes(entity.typeId)) return;
  entity.remove();
});

TABLES.regions.onLoad(() => {
  system.runInterval(async () => {
    const regions = Region.getAllRegions();
    const dimEntities: { [key: string]: Entity[] } = {};
    Object.keys(DIMENSIONS)
      .filter((k) => k.startsWith("minecraft:"))
      .forEach((k) => {
        dimEntities[k] = DIMENSIONS[k as keyof typeof DIMENSIONS].getEntities();
      });
    for (const region of regions) {
      const entities = dimEntities[region.dimensionId];
      for (const entity of entities) {
        if (region.permissions.allowedEntities.includes(entity.typeId))
          continue;
        if (!region.entityInRegion(entity)) continue;
        entity.remove();
      }
    }
  }, 20 * 5);

  /**
   * Gives player a tag if they are in a region
   */
  forEachPlayer.subscribe((player) => {
    const regions = Region.getAllRegions();
    for (const region of regions) {
      if (region.entityInRegion(player)) {
        player.addTag(`inRegion`);
        if (!region.permissions.pvp) player.addTag(`region-protected`);
      } else {
        player.removeTag(`inRegion`);
        player.removeTag(`region-protected`);
      }
    }
  }, 5);
});
