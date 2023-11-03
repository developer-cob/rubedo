import { Region } from "../models/Region.js";
import { getRole } from "../../utils.js";
import { Command } from "../../lib/Command/Command.js";

const command = new Command({
  name: "region",
  description: "Create a Region",
  requires: (player) => getRole(player) == "admin",
});

command
  .literal({
    name: "add",
    description: "Adds a new protection region",
  })
  .int("from_x")
  .int("from_z")
  .int("to_x")
  .int("to_z")
  .executes((ctx, from_x, from_z, to_x, to_z) => {
    new Region(
      { x: from_x, z: from_z },
      { x: to_x, z: to_z },
      ctx.sender.dimension.id
    );
    ctx.sender.sendMessage(
      `Created Region From ${from_x} -64 ${from_z} ${to_x} 320 ${to_z}`
    );
  });

command
  .literal({
    name: "remove",
    description: "Removes a region at the players current position",
  })
  .executes((ctx) => {
    const r = Region.removeRegionAtPosition(
      ctx.sender.location,
      ctx.sender.dimension.id
    );
    if (r) {
      ctx.sender.sendMessage(
        `Removed Region at ${JSON.stringify(ctx.sender.location)}`
      );
    } else {
      ctx.sender.sendMessage(
        `Failed to find/remove region at ${JSON.stringify(ctx.sender.location)}`
      );
    }
  });

command
  .literal({
    name: "removeAll",
    description: "Removes all regions",
  })
  .executes((ctx) => {
    Region.getAllRegions().forEach((r) => r.delete());
    ctx.sender.sendMessage(`Removed All regions`);
  });

command
  .literal({
    name: "list",
    description: "Lists all regions and positions",
  })
  .executes((ctx) => {
    const regions = Region.getAllRegions();
    for (const region of regions) {
      ctx.sender.sendMessage(
        `Region from ${region.from.x}, ${region.from.z} to ${region.to.x}, ${region.to.z} in dimension ${region.dimensionId}`
      );
    }
    if (regions.length == 0)
      return ctx.sender.sendMessage(`No regions have been made yet`);
  });

const permission = command.literal({
  name: "permission",
  description: "Handles permissions for regions",
});

permission
  .literal({
    name: "set",
    description:
      "Sets a certain permission on the region the player is currently in to a value",
  })
  .array("key", ["doorsAndSwitches", "openContainers", "pvp"] as const)
  .boolean("value")
  .executes((ctx, key, value) => {
    const region = Region.vectorInRegion(
      ctx.sender.location,
      ctx.sender.dimension.id
    );
    if (!region) return ctx.sender.sendMessage(`You are not in a region`);
    region.changePermission(key, value);
    ctx.sender.sendMessage(`Changed permission ${key} to ${value}`);
  });

permission
  .literal({
    name: "list",
    description: "Lists the permissions for the current region",
  })
  .executes((ctx) => {
    const region = Region.vectorInRegion(
      ctx.sender.location,
      ctx.sender.dimension.id
    );
    if (!region) return ctx.sender.sendMessage(`You are not in a region`);
    ctx.sender.sendMessage(
      `Current region permissions ${JSON.stringify(region.permissions)}`
    );
  });

const entityCommands = permission.literal({
  name: "entities",
  description: "Holds the subCommands for adding or removing allowedEntities",
});

entityCommands
  .literal({
    name: "add",
    description: "Adds a entity to the allowed entities list",
  })
  .string("entity")
  .executes((ctx, entity) => {
    const region = Region.vectorInRegion(
      ctx.sender.location,
      ctx.sender.dimension.id
    );
    if (!region) return ctx.sender.sendMessage(`You are not in a region`);
    const currentAllowedEntities = region.permissions.allowedEntities;
    currentAllowedEntities.push(entity);
    region.changePermission("allowedEntities", currentAllowedEntities);
    ctx.sender.sendMessage(
      `Added entity ${entity} to the allowed entities of the region your currently standing in`
    );
  });

entityCommands
  .literal({
    name: "remove",
    description: "Removes a entity from the allowed entities in the region",
  })
  .string("entity")
  .executes((ctx, entity) => {
    const region = Region.vectorInRegion(
      ctx.sender.location,
      ctx.sender.dimension.id
    );
    if (!region) return ctx.sender.sendMessage(`You are not in a region`);
    let currentAllowedEntities = region.permissions.allowedEntities;
    if (!currentAllowedEntities.includes(entity))
      return ctx.sender.sendMessage(
        `The entity ${entity} is not allowed to enter the region`
      );
    currentAllowedEntities = currentAllowedEntities.filter((v) => v != entity);
    region.changePermission("allowedEntities", currentAllowedEntities);
    ctx.sender.sendMessage(
      `Removed entity ${entity} to the allowed entities of the region your currently standing in`
    );
  });
