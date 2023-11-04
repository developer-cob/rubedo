import { Player } from "@minecraft/server";
import { getConfigId, setConfigId } from "../../utils";
import { APPEAL_LINK } from "../../config/moderation";
import { ModalForm } from "../../lib/Form/Models/ModelForm";
import { ActionForm } from "../../lib/Form/Models/ActionForm";
import { ENCHANTMENTS } from "../../config/enchantments";
import { Log } from "../models/Log";

export function manageBannedItemsForm(player: Player) {
  new ActionForm("Manage Banned Items")
    .addButton("Remove a Banned Item", null, () => {
      removeBannedItemForm(player);
    })
    .addButton("Ban an item", null, () => {
      addBannedItemForm(player);
    })
    .show(player);
}
export function removeBannedItemForm(player: Player) {
  new ModalForm("Remove Banned Items")
    .addDropdown("Select item to remove", getConfigId("banned_items"))
    .show(player, (ctx, item) => {
      let items = getConfigId("banned_items");
      items = items.filter((p) => p != item);
      setConfigId("banned_items", items);
      player.sendMessage(`Removed Banned item "${item}"`);
      new Log({
        message: `${player.name} unbanned the item: ${item}.`,
        playerName: player.name,
      });
    });
}

export function addBannedItemForm(player: Player) {
  new ModalForm("Add Banned Item")
    .addTextField("Item Id", "minecraft:string")
    .show(player, (ctx, item) => {
      let items = getConfigId("banned_items");
      if (items.includes(item))
        return ctx.error(`§cItem "${item}" is already banned`);
      items.push(item);
      setConfigId("banned_items", items);
      player.sendMessage(`Banned the item "${item}"`);
      new Log({
        message: `${player.name} banned the item: ${item}.`,
        playerName: player.name,
      });
    });
}

export function manageBannedBlocksForm(player: Player) {
  new ActionForm("Manage Banned Blocks")
    .addButton("Remove a Banned Block", null, () => {
      removeBannedBlockForm(player);
    })
    .addButton("Ban an block", null, () => {
      addBannedBlockForm(player);
    })
    .show(player);
}

export function removeBannedBlockForm(player: Player) {
  new ModalForm("Remove Banned Block")
    .addDropdown("Select block to remove", getConfigId("banned_blocks"))
    .show(player, (ctx, block) => {
      let blocks = getConfigId("banned_blocks");
      blocks = blocks.filter((p) => p != block);
      setConfigId("banned_blocks", blocks);
      player.sendMessage(`Removed Banned block "${block}"`);
      new Log({
        message: `${player.name} unbanned the block: ${block}.`,
        playerName: player.name,
      });
    });
}

export function addBannedBlockForm(player: Player) {
  new ModalForm("Add Banned Block")
    .addTextField("Block Id", "minecraft:barrier")
    .show(player, (ctx, block) => {
      let blocks = getConfigId("banned_blocks");
      if (blocks.includes(block))
        return ctx.error(`§cBlock "${block}" is already banned`);
      blocks.push(block);
      setConfigId("banned_blocks", blocks);
      player.sendMessage(`Banned the block "${block}"`);
      new Log({
        message: `${player.name} banned the block: ${block}.`,
        playerName: player.name,
      });
    });
}

export function manageEnchantmentLevelsForm(player: Player) {
  new ModalForm("Manage Enchantment Levels")
    .addDropdown("Enchantment to change", Object.keys(ENCHANTMENTS), 0)
    .addTextField("Level (number)", "5")
    .show(player, (ctx, enchantment, levelString) => {
      if (isNaN(levelString as any))
        return ctx.error(
          `§c"${levelString}" is not a number, please enter a value like, "3", "9", etc.`
        );
      const level = parseInt(levelString);
      let enchants = getConfigId("enchantments");
      enchants[enchantment as keyof typeof ENCHANTMENTS] = level;
      setConfigId("enchantments", enchants);
      player.sendMessage(`Set max level for ${enchantment} to ${level}`);
      new Log({
        message: `${player.name} set max enchant level for ${enchantment} to ${level}.`,
        playerName: player.name,
      });
    });
}

export function manageAppealLinkForm(player: Player) {
  new ModalForm("Manage Appeal Link")
    .addTextField("Appeal Link", APPEAL_LINK)
    .show(player, (ctx, link) => {
      setConfigId("appealLink", link);
      player.sendMessage(`Changed the servers appeal link to ${link}`);
      new Log({
        message: `${player.name} changed server appeal link to: ${link}.`,
        playerName: player.name,
      });
    });
}
