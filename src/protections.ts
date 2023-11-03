import type { Protection } from "./modules/models/Protection";
import { TABLES } from "./tables";

/**
 * All protections in this anti-cheat
 */
export const PROTECTIONS: { [key: string]: Protection<any> } = {};

TABLES.protections.onLoad(() => {
  for (const protection of Object.values(PROTECTIONS)) {
    if (!protection.getConfig().enabled ?? protection.isEnabledByDefault)
      continue;
    protection.enable();
  }
});
