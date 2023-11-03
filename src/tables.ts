import { Database } from "./database/Database";
import {
  IBanData,
  IFreezeData,
  IMuteData,
  INpcLocation,
  IProtectionsConfig,
  IRegionDB,
  LogData,
  ROLES,
} from "./types";

export const TABLES = {
  config: new Database<any>("config"),
  freezes: new Database<IFreezeData>("freezes"),
  mutes: new Database<IMuteData>("mutes"),
  bans: new Database<IBanData>("bans"),
  regions: new Database<IRegionDB>("regions"),
  roles: new Database<keyof typeof ROLES>("roles"),
  tasks: new Database<any>("tasks"),
  npcs: new Database<INpcLocation>("npcs"),
  ids: new Database<string>("ids"),
  logs: new Database<LogData>("logs"),
  protections: new Database<IProtectionsConfig>("protections"),
};
