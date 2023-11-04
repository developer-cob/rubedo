import { PREFIX } from "../../config/commands";
import { PlayerLog } from "../../database/PlayerLog";
import { getRole } from "../../utils";
import { Log } from "../models/Log";
import { Mute } from "../models/Mute";
import { Protection } from "../models/Protection";

const previousMessage = new PlayerLog<string>();

/**
 * Stores per world load violation data for players
 */
const ViolationCount = new PlayerLog<number>();

const protection = new Protection<{
  permMutePlayer: boolean;
  violationCount: number;
  repeatedMessages: boolean;
  zalgo: boolean;
}>(
  "spam",
  "Blocks spam in chat",
  "textures/ui/mute_on.png",
  false
).setConfigDefault({
  permMutePlayer: {
    description:
      "If player should be permanently muted once violation count is met.",
    defaultValue: false,
  },
  violationCount: {
    description: "Violation count before permanent mute",
    defaultValue: 0,
  },
  repeatedMessages: {
    description: "Blocks repeated messages",
    defaultValue: true,
  },
  zalgo: {
    description: "Blocks zalgo",
    defaultValue: true,
  },
});

protection.subscribe("chatSend", (data) => {
  try {
    if (data.message.startsWith(PREFIX)) return;
    if (["admin", "moderator"].includes(getRole(data.sender))) return;
    const config = protection.getConfig();
    const isSpam = () => {
      const count = (ViolationCount.get(data.sender) ?? 0) + 1;
      ViolationCount.set(data.sender, count);
      new Log({
        message: `${data.sender.name} has a updated spam violation count of: ${count}.`,
        playerName: data.sender.name,
      });
      if (config.permMutePlayer && count >= config.violationCount)
        new Mute(data.sender, null, "Spamming");
    };
    if (
      config.repeatedMessages &&
      previousMessage.get(data.sender) == data.message
    ) {
      data.cancel = true;
      isSpam();
      new Log({
        message: `${data.sender.name} has sent repeated messages.`,
        playerName: data.sender.name,
      });
      return data.sender.sendMessage(`§cRepeated message detected!`);
    }
    if (config.zalgo && /%CC%/g.test(encodeURIComponent(data.message))) {
      data.cancel = true;
      isSpam();
      new Log({
        message: `${data.sender.name} has sent zalgo messages.`,
        playerName: data.sender.name,
      });
      return data.sender.sendMessage(
        `§cYou message contains some type of zalgo and cannot be sent!`
      );
    }
    previousMessage.set(data.sender, data.message);
  } catch (error) {
    console.warn(error + error.stack);
  }
});
