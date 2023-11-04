import { Mute } from "../models/Mute.js";
import { TABLES } from "../../tables.js";
import { beforeChat } from "../../lib/Events/beforeChat.js";
import { text } from "../../lang/text.js";
import { Log } from "../models/Log.js";

beforeChat.subscribe((data) => {
  const muteData = Mute.getMuteData(data.sender);
  if (!muteData) return;
  if (muteData.expire && muteData.expire < Date.now())
    return TABLES.mutes.delete(data.sender.name);
  data.cancel = true;
  data.sender.sendMessage(text["modules.managers.mute.isMuted"]());
  new Log({
    message: `${data.sender.name} tried to send a message while muted: ${data.message}`,
    playerName: data.sender.name,
  });
});
