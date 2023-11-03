import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";
import { Player } from "@minecraft/server";
import { ButtonCallback, IActionFormButton, Range } from "../types";
import { TIMEOUT_THRESHOLD } from "../../../config/form";
import { CHEST_GUI_SIZES, TYPEID_TO_AUX } from "../../../config/chestGui";

export interface ChestGuiItemButton {
  name: string;
  lore?: string[];
  iconPath?: string;
  typeId?: string;
  stackSize?: number;
  enchanted?: boolean;
}

export class ChestFormData {
  /**
   * Size of this chest
   */
  private size: keyof typeof CHEST_GUI_SIZES;

  /**
   * The buttons this form has
   */
  private buttons: IActionFormButton[];

  /**
   * The amount of times it takes to show this form in ms
   * if this value goes above 200 it will time out
   */
  private triedToShow: number;

  /**
   * The title for this form
   */
  private title: string;

  /**
   * Creates a new form to be shown to a player
   * @param title the title that this form should have
   * @param size The size of the chest. Can be 'small' or 'large'.
   */
  constructor(size: keyof typeof CHEST_GUI_SIZES) {
    this.size = size;

    this.buttons = [];
    this.triedToShow = 0;
  }

  /**
   * This builder method sets the title for the chest ui.
   * @param text The title text for the chest ui.
   */
  setTitle(text: string): ChestFormData {
    this.title = text;
    return this;
  }

  /**
   * Gets button syntax based on chest gui item.
   * @param item
   * @returns
   */
  private getButtonSyntax(
    item: ChestGuiItemButton,
    prefix: "cht" | "inv" | "hot"
  ) {
    let iconPath = item.iconPath ?? "";
    if (item.typeId) {
      const id = TYPEID_TO_AUX.get(item.typeId) ?? 255;
      const itemId = id * 65536;
      const enchantedBit = item.enchanted ? 32768 : 0;
      iconPath = (itemId + enchantedBit).toString();
    }
    return {
      text: `${prefix}:stack#${(item.stackSize ?? 1)
        .toString()
        .padStart(2, "0")}§r${item.name}§r\n§r${(item.lore ?? []).join(
        "\n§r"
      )}`,
      iconPath,
    };
  }

  /**
   * Adds a button to this chest ui with an icon from a resource pack.
   * @param slot The slot to display the item in.
   * @param item The data for the item to be displayed
   * @param callback If no callback item is not clickable/hoverable
   */
  addButton(
    slot: number,
    item: ChestGuiItemButton,
    callback?: ButtonCallback
  ): ChestFormData {
    if (item.iconPath && item.typeId)
      throw new Error(`TypeId and IconPath cant be defined together.`);
    if (item.stackSize && (item.stackSize > 99 || item.stackSize < 1))
      throw new Error(`Item stack size must be between the range 1-99`);
    const syntax = this.getButtonSyntax(item, "cht");
    this.buttons[slot] = {
      text: syntax.text,
      iconPath: syntax.iconPath,
      callback,
    };
    return this;
  }

  /**
   * Running this will render the players inventory onto the chest gui
   */
  private renderInventory(player: Player) {
    const inventory = player.getComponent("inventory").container;
    const sizeSlots = CHEST_GUI_SIZES[this.size].slots;
    for (var slot = 0; slot < inventory.size; slot++) {
      const item = inventory.getItem(slot);
      const index = slot < 9 ? sizeSlots + 27 + slot : sizeSlots + slot - 9;
      if (!item) {
        this.buttons[index] = { text: "" }; // Push Empty Item
        continue;
      }
      const syntax = this.getButtonSyntax(
        {
          name: item.typeId,
          typeId: item.typeId,
          stackSize: item.amount,
        },
        slot < 9 ? "hot" : "inv"
      );
      this.buttons[index] = {
        text: syntax.text,
        // ((372 + slot) * 65536).toString()
        iconPath: syntax.iconPath,
      };
    }
  }

  /**
   * Creates and shows this modal popup form. Returns
   * asynchronously when the player confirms or cancels the
   * dialog.
   *
   * This function can't be called in read-only mode.
   *
   * @param player
   * @param onInventoryClick slot 0-8 is hot bar, and 9-35 is inventory
   * Player to show this dialog to.
   */
  show(
    player: Player,
    renderInventory?: boolean,
    onInventoryClick?: (slot: Range<0, 35>) => void,
    onUserClosed?: () => void
  ) {
    const form = new ActionFormData();
    form.title(CHEST_GUI_SIZES[this.size].id + this.title);
    // Register Blank Slots
    const slots = CHEST_GUI_SIZES[this.size].slots;
    const slotsToFill = slots % 9 == 0 ? slots : slots * 9;
    for (let i = 0; i < slotsToFill; i++) {
      if (this.buttons[i]) continue;
      this.buttons[i] = {
        text: "",
      };
    }
    if (renderInventory) this.renderInventory(player);
    for (const button of this.buttons) {
      if (!button) continue;
      form.button(button.text, button.iconPath);
    }
    this.triedToShow = 0;
    form.show(player).then((response) => {
      if (response.canceled) {
        if (response.cancelationReason == FormCancelationReason.UserBusy) {
          // check time and reshow form
          if (this.triedToShow > TIMEOUT_THRESHOLD)
            return player.sendMessage({
              translate: "forms.actionForm.show.timeout",
            });
          this.triedToShow++;
          this.show(player, renderInventory, onInventoryClick, onUserClosed);
        }
        if (response.cancelationReason == FormCancelationReason.UserClosed)
          onUserClosed?.();
        return;
      }
      if (response.selection == null) return;

      if (response.selection >= CHEST_GUI_SIZES[this.size].slots) {
        const slot = response.selection - CHEST_GUI_SIZES[this.size].slots;
        return onInventoryClick?.(
          (slot <= 26 ? slot + 9 : slot - 27) as Range<0, 35>
        );
      }
      this.buttons[response.selection].callback?.();
    });
  }
}
