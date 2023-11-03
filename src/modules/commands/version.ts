import { VERSION } from "../../config/app";
import { Command } from "../../lib/Command/Command";

new Command({
  name: "version",
  description: "Get Current Rubedo Version",
  aliases: ["v"],
}).executes((ctx) => {
  ctx.sender.sendMessage(`Current Rubedo Version: ${VERSION}`);
});
