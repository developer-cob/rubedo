import { BeforeChatEvent, Player } from "mojang-minecraft";

export class CommandCallback {
  data: BeforeChatEvent;
  sender: Player;

  /**
   * Returns a commands callback
   * @param data chat data that was used
   */
  constructor(data: BeforeChatEvent) {
    this.data = data;
    this.sender = data.sender;
  }
  /**
   * Replys to the sender of a command callback
   * @param text Message or a lang code
   * @example ctx.reply('Hello World!');
   */
  reply(text: string) {
    this.sender.tell(text);
  }
}
