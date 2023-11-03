import { Block, Player, system, world } from "@minecraft/server";
import { Region } from "../models/Region.js";
import { DIMENSIONS, fillBlocksBetween, getRole } from "../../utils.js";
import { BLOCK_CONTAINERS, DOORS_SWITCHES } from "../../config/region.js";
import { MinecraftBlockTypes } from "../../config/vanilla-data/mojang-block.js";
import { forEachPlayer } from "../../lib/Events/forEachPlayer.js";
import { TABLES } from "../../tables.js";

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
  if (["moderator", "admin"].includes(getRole(data.player as Player))) return;
  if (data.player.isOp()) return;
  const region = Region.vectorInRegion(
    data.block.location,
    data.block.dimension.id
  );
  if (!region) return;
  if (
    DOORS_SWITCHES.includes(data.block.typeId) &&
    region.permissions.doorsAndSwitches
  )
    return;
  if (
    BLOCK_CONTAINERS.includes(data.block.typeId) &&
    region.permissions.openContainers
  )
    return;
  data.cancel = true;
});

world.beforeEvents.playerPlaceBlock.subscribe((data) => {
  if (["moderator", "admin"].includes(getRole(data.player as Player))) return;
  if (data.player.isOp()) return;
  const region = Region.vectorInRegion(
    data.block.location,
    data.block.dimension.id
  );
  if (!region) return;
  data.cancel = true;
  system.run(() => {
    data.player.playSound("note.bass");
    data.player.sendMessage({
      translate: "events.claimManager.interact.invalidPermission",
    });
  });
});

world.beforeEvents.playerBreakBlock.subscribe((data) => {
  if (["moderator", "admin"].includes(getRole(data.player as Player))) return;
  if (data.player.isOp()) return;
  const region = Region.vectorInRegion(
    data.block.location,
    data.block.dimension.id
  );
  if (!region) return;
  data.cancel = true;
  system.run(() => {
    data.player.playSound("note.bass");
    data.player.sendMessage({
      translate: "events.claimManager.interact.invalidPermission",
    });
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
    for (const region of Region.getAllRegions()) {
      const entities = DIMENSIONS[
        region.dimensionId as keyof typeof DIMENSIONS
      ].getEntities({ excludeTypes: region.permissions.allowedEntities });
      for (const entity of entities) {
        if (!region.entityInRegion(entity)) continue;
        entity.remove();
      }
    }
  }, 100);

  /**
   * Gives player a tag if they are in a region
   */
  forEachPlayer.subscribe((player) => {
    for (const region of Region.getAllRegions()) {
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
