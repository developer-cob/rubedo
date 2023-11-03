import { ItemStack, Player, WorldBeforeEvents } from "@minecraft/server";
import { ENCHANTMENTS } from "./config/enchantments";

export interface IMsOptions {
  compactDuration?: string;
  fullDuration?: string;
  avoidDuration?: Array<string>;
}

export interface IplayerTickRegister {
  /**
   * callback to send
   */
  callback: (player: Player) => void;
  /**
   * delay in ticks
   */
  delay: number;
  /**
   * the last tick it sent a callback
   */
  lastCall: number;
}

export interface ISlotChangeReturn {
  /**
   * Slot that changed
   */
  slot: number;
  /**
   * the item that was grabbed / put
   */
  item: ItemStack;
}

export interface IEvents {
  [key: string]: any;
}

export interface IChangePlayerRoleData {
  /**
   * The name of the player
   */
  playerName: string;
  /**
   * The role that the player should be set to
   */
  role: keyof typeof ROLES;
}

export type durationSegmentType = "y" | "w" | "d" | "h" | "m" | "s" | "ms";
export type durationSegment = `${number}${durationSegmentType}`;

/**
 * The roles that are in this server
 */
export enum ROLES {
  member,
  admin,
  moderator,
  builder,
}

export type ConfigType = {
  /**
   * {@link BANNED_ITEMS}
   */
  banned_items: string[];
  /**
   * {@link BANNED_BLOCKS}
   */
  banned_blocks: string[];
  /**
   * {@link ENCHANTMENTS}
   */
  enchantments: {
    [Property in keyof typeof ENCHANTMENTS]: number;
  };
  /**
   * Appeal Link for the server
   */
  appealLink: string;
};

export interface LogData {
  /**
   * An optional playerName who is associated with this log
   * @example "Smell of curry"
   */
  playerName?: string;
  /**
   * The message for this log
   * @example "Smell of curry is bad"
   */
  message: string;
  /**
   * An optional property to list what protection this was from
   */
  protection?: string;
}

export type EventsReturnType<T extends keyof WorldBeforeEvents> = (
  arg: Parameters<Parameters<WorldBeforeEvents[T]["subscribe"]>[0]>[0]
) => void;

export type IProtectionsConfig = {
  [key: string]: boolean | string | number;
  /**
   * If this protection is enabled
   */
  enabled: boolean;
};

export interface IBanData {
  /**
   * The unique id of this ban
   */
  key: string;
  /**
   * The playersName of who was banned
   * @example "Smell of curry"
   */
  playerName: string;
  /**
   * The date in MS when this player was banned
   */
  date: number;
  /**
   * The duration in ms that this ban will be for
   * if null player is banned forever
   */
  duration?: number;
  /**
   * When this ban will expire, if null it will never expire meaning player is banned forever
   */
  expire?: number;
  /**
   * The reason for why this player was banned
   * @example "Hacking"
   */
  reason?: string;
  /**
   * Who banned this player
   * @example "Smell of curry"
   * @example "Rubedo Anti Cheat"
   */
  by?: string;
}

export interface IFreezeData {
  /**
   * Players name of who was banned
   */
  playerName: string;
  /**
   * Unique id of this freeze instance
   */
  key: string;
  /**
   * The reason for this freeze
   */
  reason?: string;
  /**
   * The location of this freeze
   */
  location: {
    x: number;
    y: number;
    z: number;
    dimension: string;
  };
}

export interface IMuteData {
  /**
   * Players name of who is muted
   * @example "Smell of curry"
   */
  playerName: string;
  /**
   * The date this player got muted
   */
  date: number;
  /**
   * The duration of this mute in ms
   * if null player is muted forever
   */
  duration?: number;
  /**
   * When this players mute will expire in ms
   * if null this mute will never expire
   */
  expire?: number;
  /**
   * Why this player is muted
   * @example "Spamming"
   */
  reason?: string;
  /**
   * Who muted this player
   * @example "Smell of curry"
   * @example "Rubedo Anti Cheat"
   */
  by?: string;
}

export interface INpcLocation {
  dimension: string;
  x: number;
  y: number;
  z: number;
}

export interface IRegionDB {
  dimensionId: string;
  from: IRegionCords;
  to: IRegionCords;
  key: string;
  permissions: IRegionPermissions;
}

export interface IRegionCords {
  x: number;
  z: number;
}

export interface IRegionPermissions {
  /**
   * if the player can use chests, default: true
   */
  doorsAndSwitches: Boolean;
  /**
   * if the player can use doors, default: true
   */
  openContainers: Boolean;
  /**
   * if players can fight, default: false
   */
  pvp: Boolean;
  /**
   * the entities allowed in this region
   */
  allowedEntities: Array<string>;
}
