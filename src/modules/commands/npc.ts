import { Command } from "../../lib/Command/Command.js";
import { getRole } from "../../utils.js";
import { Log } from "../models/Log.js";
import { Npc } from "../models/Npc.js";

new Command({
  name: "npc",
  description: "Spawns a npc at your coordinates",
  requires: (player) => getRole(player) == "admin",
}).executes((ctx) => {
  new Npc(ctx.sender.location, ctx.sender.dimension);
  ctx.sender.sendMessage(`Spawned a verified npc at your current location`);
  new Log({
    message: `${
      ctx.sender.name
    }'s Created a new NPC at location: ${JSON.stringify(
      ctx.sender.location
    )} in Dimension: ${ctx.sender.dimension.id}.`,
    playerName: ctx.sender.name,
  });
});
