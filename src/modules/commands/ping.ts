import { system } from "@minecraft/server";
import { Command } from "../../lib/Command/Command";

async function getServerTPS(): Promise<number> {
  let startTime = Date.now();
  let ticks = 0;
  return new Promise((resolve) => {
    let s = system.runTimeout(() => {
      if (Date.now() - startTime < 1000) {
        ticks++;
      } else {
        system.clearRun(s);
        resolve(ticks);
      }
    });
  });
}

new Command({
  name: "ping",
  description: "Returns the current Ticks Per Second of the servers ping",
}).executes(async (ctx) => {
  let ticks = await getServerTPS();
  ctx.sender.sendMessage(
    `§aCurrent Ticks Per Second: ${
      ticks > 18 ? "§f{ §aGood" : ticks > 13 ? "§f{ §eOk" : "§f{ §cSevere"
    } ${ticks} §f}`
  );
});
