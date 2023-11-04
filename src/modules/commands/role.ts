import {
  getRole,
  getServerOwner,
  isServerOwner,
  setRole,
  setServerOwner,
} from "../../utils.js";
import { TABLES } from "../../tables.js";
import { ROLES } from "../../types";
import { ArgumentTypes, Command } from "../../lib/Command/Command.js";
import { confirmAction } from "../../lib/Form/utils.js";
import { Log } from "../models/Log.js";

// Helper
const StringIsNumber = (value: any) => isNaN(Number(value)) === false;

// Turn enum into array
function ToArray(enumme: any) {
  return (
    Object.keys(enumme)
      // @ts-ignore
      .filter(StringIsNumber)
      .map((key) => enumme[key])
  );
}

const root = new Command({
  name: "role",
  description: "Changes the role for a player",
  requires: (player) => getRole(player) == "admin" || isServerOwner(player),
});

root
  .literal({
    name: "set",
    description: "Sets the role for a player",
  })
  .argument(new ArgumentTypes.playerName("playerName"))
  .argument(new ArgumentTypes.array("role", ToArray(ROLES) as string[]))
  .executes((ctx, playerName, role) => {
    setRole(playerName, role as keyof typeof ROLES);
    ctx.sender.sendMessage(`Changed role of ${playerName} to ${role}`);
    new Log({
      message: `${ctx.sender.name} Updated ${playerName}'s role to: ${role}.`,
      playerName: playerName,
    });
  });

root
  .literal({
    name: "get",
    description: "Gets the role of a player",
  })
  .argument(new ArgumentTypes.playerName("playerName"))
  .executes((ctx, playerName) => {
    const role = getRole(playerName);
    ctx.sender.sendMessage(`${playerName} has role: ${role}`);
  });

const ownerRoot = root.literal({
  name: "owner",
  description: "Manages the owner",
});

ownerRoot
  .literal({
    name: "get",
    description: "Gets the owner of the world",
  })
  .executes((ctx) => {
    const ownerId = getServerOwner();
    const ids = TABLES.ids.collection();
    const ownerName = Object.keys(ids).find((key) => ids[key] === ownerId);
    ctx.sender.sendMessage(`§aServer Owner: ${ownerName} (id: ${ownerId})`);
  });

ownerRoot
  .literal({
    name: "transfer",
    description: "Transfers the owner of the world",
    requires: (player) => isServerOwner(player),
  })
  .argument(new ArgumentTypes.player())
  .executes((ctx, player) => {
    confirmAction(
      ctx.sender,
      `Are you sure you want to transfer the server ownership to ${player.name}, this action is not reversible!`,
      () => {
        setServerOwner(player);
        ctx.sender.sendMessage(
          `§aSet the server Owner to: ${player.name} (id: ${player.id})`
        );
        new Log({
          message: `${ctx.sender.name} Transferred server ownership to ${player.name}.`,
          playerName: player.name,
        });
      }
    );
    ctx.sender.sendMessage(`§aClose chat to confirm`);
  });

ownerRoot
  .literal({
    name: "clear",
    description: "clear's the owner of the world",
    requires: (player) => isServerOwner(player),
  })
  .executes((ctx) => {
    confirmAction(
      ctx.sender,
      "Are you sure you want to clear the server owner, this action is not reversible!",
      () => {
        setServerOwner(null);
        ctx.sender.sendMessage(
          `§aCleared the server owner! run "/reload" or reload world to run "/function start" again!`
        );
        new Log({
          message: `${ctx.sender.name} Cleared the servers ownership.`,
          playerName: ctx.sender.name,
        });
      }
    );
    ctx.sender.sendMessage(`§aClose chat to confirm`);
  });
