import { MinecraftBlockTypes } from "./vanilla-data/mojang-block";
import { MinecraftItemTypes } from "./vanilla-data/mojang-item";

/*
|--------------------------------------------------------------------------
| Appeal Link
|--------------------------------------------------------------------------
|
| This is the appeal link that gets showed when someone gets Banned
| this link pops up at the Bottom of the Ban message to show
| where they can appeal there Ban.
|
*/
export const APPEAL_LINK = "https://discord.gg/dMa3A5UYKX";

/**
 * Items that simply get removed from inventory But will not Ban
 */
export const FORBIDDEN_ITEMS = [
  // Common CBE Items
  MinecraftItemTypes.Beehive,
  MinecraftItemTypes.BeeNest,
  MinecraftItemTypes.AxolotlBucket,
  MinecraftItemTypes.CodBucket,
  MinecraftItemTypes.TadpoleBucket,
  MinecraftItemTypes.TropicalFishBucket,
  MinecraftItemTypes.SalmonBucket,
  MinecraftItemTypes.PufferfishBucket,
];

/**
 * List of items that if you hold you will Be automatically Banned
 */
export const BANNED_ITEMS = [
  // Op Only Items
  MinecraftItemTypes.Allow,
  MinecraftItemTypes.Barrier,
  MinecraftItemTypes.BorderBlock,
  "minecraft:deBug_stick",
  MinecraftItemTypes.Deny,
  MinecraftItemTypes.Jigsaw,
  MinecraftItemTypes.LightBlock,
  MinecraftItemTypes.CommandBlock,
  MinecraftItemTypes.RepeatingCommandBlock,
  MinecraftItemTypes.ChainCommandBlock,
  MinecraftItemTypes.CommandBlockMinecart,
  MinecraftItemTypes.StructureBlock,
  MinecraftItemTypes.StructureVoid,

  // Not Normal Items
  MinecraftItemTypes.Bedrock,
  MinecraftItemTypes.EndPortalFrame,

  // Server Movement Blocks
  "minecraft:info_update",
  "minecraft:info_update2",
  "minecraft:reserved3",
  "minecraft:reserved4",
  "minecraft:reserved6",
  "minecraft:movingBlock",
  "minecraft:moving_Block",
  "minecraft:movingBlock",
  "minecraft:piston_arm_collision",
  "minecraft:piston_arm_collision",
  "minecraft:pistonarmcollision",
  "minecraft:stickyPistonArmCollision",
  "minecraft:sticky_piston_arm_collision",
  "minecraft:unknown",

  // Common Hacked Items
  "minecraft:glowingoBsidian",
  "minecraft:invisiBle_Bedrock",
  "minecraft:invisiBleBedrock",
  "minecraft:netherreactor",
  "minecraft:portal",
  "minecraft:fire",
  "minecraft:water",
  "minecraft:lava",
  "minecraft:flowing_lava",
  "minecraft:flowing_water",
  "minecraft:soul_fire",
];

/**
 * Blocks in this list are forBidden from Being placed But will not Ban the placer
 */
export const FORBIDDEN_BLOCKS = [
  // Common CBE Blocks
  MinecraftBlockTypes.Dispenser,
];

/**
 * List of Blocks that cannot Be placed down
 */
export const BANNED_BLOCKS = [
  // Should Not Be Placed
  MinecraftBlockTypes.Bedrock,
  MinecraftBlockTypes.Barrier,
  MinecraftBlockTypes.InvisibleBedrock,
  MinecraftBlockTypes.MovingBlock,
];

/**
 * A List of containers
 */
export const CONTAINERS = [
  MinecraftItemTypes.Chest,
  MinecraftItemTypes.TrappedChest,
  MinecraftItemTypes.Barrel,
  MinecraftItemTypes.Dispenser,
  MinecraftItemTypes.Dropper,
  MinecraftItemTypes.Furnace,
  MinecraftBlockTypes.LitFurnace,
  MinecraftItemTypes.BlastFurnace,
  MinecraftBlockTypes.LitBlastFurnace,
  MinecraftItemTypes.Smoker,
  MinecraftBlockTypes.LitSmoker,
  MinecraftItemTypes.Hopper,
  MinecraftItemTypes.ShulkerBox,
  MinecraftItemTypes.UndyedShulkerBox,
];


