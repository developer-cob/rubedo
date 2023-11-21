// src/index.ts
import { system as system7 } from "@minecraft/server";

// src/lib/DynamicPropertyWrapper/DynamicProperty.ts
import { world } from "@minecraft/server";
var DynamicProperty = class {
  constructor(id, rootType) {
    this.identifier = id;
    this.rootType = rootType;
    this.entityTypes = [];
  }
  compile(value) {
    if (typeof value == "number")
      return value;
    if (typeof value == "boolean")
      return value;
    if (typeof value == "string")
      return value;
    if (this.rootType == "vector")
      return value;
    return JSON.stringify(value);
  }
  unCompile(value) {
    if (value == void 0)
      return void 0;
    if (["boolean", "number", "string", "vector"].includes(this.rootType))
      return value;
    return JSON.parse(value);
  }
  registerEntityTypes(entityTypes) {
    this.entityTypes = this.entityTypes.concat(entityTypes);
    return this;
  }
  setWorldDynamic(value = true) {
    this.isWorldDynamic = value;
    return this;
  }
  get(entity) {
    try {
      if (entity)
        return this.unCompile(entity.getDynamicProperty(this.identifier));
      if (!this.isWorldDynamic)
        throw new Error(`${this.identifier} Is not World Dynamic!`);
      return this.unCompile(world.getDynamicProperty(this.identifier));
    } catch (error) {
      return void 0;
    }
  }
  set(value, entity) {
    let parsedValue = value ? this.compile(value) : void 0;
    if (entity) {
      const typeId = entity.typeId;
      if (!this.entityTypes.find((t) => t.id == typeId))
        throw new Error(
          `${entity.id} Is not a registered entity type for ${this.identifier}!`
        );
      if (!entity.isValid())
        throw new Error(
          `Failed to set Dynamic Property on: ${entity.id}, Entity is not Valid`
        );
      try {
        entity.setDynamicProperty(this.identifier, parsedValue);
      } catch (error) {
        console.warn(
          `[Dynamic Property Wrapper] Failed to set ${this.identifier} on: ${entity.id}, ${error + error.stack}`
        );
      }
    } else {
      if (!this.isWorldDynamic)
        throw new Error(`${this.identifier} Is not World Dynamic!`);
      try {
        world.setDynamicProperty(this.identifier, parsedValue);
      } catch (error) {
        console.warn(
          `[Dynamic Property Wrapper] Failed to set Dynamic Property on: World, ${error + error.stack}`
        );
      }
    }
  }
  remove(entity) {
    this.set(void 0, entity);
  }
};

// src/lib/Command/index.ts
import { system, world as world5 } from "@minecraft/server";

// src/config/commands.ts
var PREFIX = "-";

// src/lib/Command/ArgumentTypes.ts
import { world as world3 } from "@minecraft/server";

// src/database/Database.ts
import { world as world2 } from "@minecraft/server";
var Database = class {
  constructor(tableName) {
    this.tableName = tableName;
    this.tableName = tableName;
    this.MEMORY = null;
    this.QUEUE = [];
    let data = world2.getDynamicProperty(`db_${this.tableName}`) ?? "{}";
    if (typeof data != "string")
      throw "Database Set with Unknown Value!";
    const LOADED_DATA = JSON.parse(data);
    this.MEMORY = LOADED_DATA;
    this.onLoadCallback?.(LOADED_DATA);
    this.QUEUE.forEach((v) => v());
  }
  async addQueueTask() {
    return new Promise((resolve) => {
      this.QUEUE.push(resolve);
    });
  }
  async saveData() {
    if (!this.MEMORY)
      await this.addQueueTask();
    world2.setDynamicProperty(
      `db_${this.tableName}`,
      JSON.stringify(this.MEMORY)
    );
  }
  async onLoad(callback) {
    if (this.MEMORY)
      return callback(this.MEMORY);
    this.onLoadCallback = callback;
  }
  async set(key, value) {
    if (!this.MEMORY)
      throw new Error("Data tried to be set before load!");
    this.MEMORY[key] = value;
    return this.saveData();
  }
  get(key) {
    if (!this.MEMORY)
      throw new Error(
        "Entities not loaded! Consider using `getAsync` instead!"
      );
    return this.MEMORY[key];
  }
  async getSync(key) {
    if (this.MEMORY)
      return this.get(key);
    await this.addQueueTask();
    if (!this.MEMORY)
      return null;
    return this.MEMORY[key];
  }
  keys() {
    if (!this.MEMORY)
      throw new Error(
        "Entities not loaded! Consider using `keysSync` instead!"
      );
    return Object.keys(this.MEMORY);
  }
  async keysSync() {
    if (this.MEMORY)
      return this.keys();
    await this.addQueueTask();
    if (!this.MEMORY)
      return [];
    return Object.keys(this.MEMORY);
  }
  values() {
    if (!this.MEMORY)
      throw new Error(
        "Entities not loaded! Consider using `valuesSync` instead!"
      );
    return Object.values(this.MEMORY);
  }
  async valuesSync() {
    if (this.MEMORY)
      return this.values();
    await this.addQueueTask();
    if (!this.MEMORY)
      return [];
    return Object.values(this.MEMORY);
  }
  has(key) {
    if (!this.MEMORY)
      throw new Error("Entities not loaded! Consider using `hasSync` instead!");
    return Boolean(this.MEMORY[key]);
  }
  async hasSync(key) {
    if (this.MEMORY)
      return this.has(key);
    await this.addQueueTask();
    if (!this.MEMORY)
      return false;
    return Boolean(this.MEMORY[key]);
  }
  collection() {
    if (!this.MEMORY)
      throw new Error(
        "Entities not loaded! Consider using `collectionSync` instead!"
      );
    return this.MEMORY;
  }
  async collectionSync() {
    if (this.MEMORY)
      return this.collection();
    await this.addQueueTask();
    if (!this.MEMORY)
      return {};
    return this.MEMORY;
  }
  async delete(key) {
    if (!this.MEMORY)
      return false;
    const status = delete this.MEMORY[key];
    await this.saveData();
    return status;
  }
  async clear() {
    this.MEMORY = {};
    return await this.saveData();
  }
  getKeyByValue(value) {
    for (const key in this.MEMORY) {
      if (this.MEMORY[key] === value) {
        return key;
      }
    }
    return null;
  }
};

// src/tables.ts
var TABLES = {
  config: new Database("config"),
  freezes: new Database("freezes"),
  mutes: new Database("mutes"),
  bans: new Database("bans"),
  regions: new Database("regions"),
  roles: new Database("roles"),
  tasks: new Database("tasks"),
  npcs: new Database("npcs"),
  ids: new Database("ids"),
  logs: new Database("logs"),
  protections: new Database("protections")
};

// src/lib/Command/ArgumentTypes.ts
function fetch(playerName) {
  return [...world3.getPlayers()].find((player) => player.name === playerName);
}
var LiteralArgumentType = class {
  constructor(name = "literal") {
    this.name = name;
    this.typeName = "literal";
    this.name = name;
  }
  matches(value) {
    return {
      success: this.name == value
    };
  }
  fail(value) {
    return `${value} should be ${this.name}!`;
  }
};
var StringArgumentType = class {
  constructor(name = "string") {
    this.name = name;
    this.typeName = "string";
    this.name = name;
  }
  matches(value) {
    return {
      success: Boolean(value && value != ""),
      value
    };
  }
  fail(_value) {
    return `Value must be of type string!`;
  }
};
var IntegerArgumentType = class {
  constructor(name = "integer", range) {
    this.name = name;
    this.typeName = "int";
    this.name = name;
    this.range = range;
  }
  static isNumberInRange(numberToCheck, range) {
    return numberToCheck >= range[0] && numberToCheck <= range[1];
  }
  matches(value) {
    return {
      success: this.range ? IntegerArgumentType.isNumberInRange(parseInt(value), this.range) : !isNaN(Number(value)),
      value: parseInt(value)
    };
  }
  fail(_value) {
    return `Value must be valid number!`;
  }
};
var FloatArgumentType = class {
  constructor(name = "float") {
    this.name = name;
    this.typeName = "float";
    this.name = name;
  }
  matches(value) {
    return {
      success: Boolean(value?.match(/^\d+\.\d+$/)?.[0]),
      value: parseInt(value)
    };
  }
  fail(_value) {
    return `Value must be valid float!`;
  }
};
var LocationArgumentType = class {
  constructor(name = "location") {
    this.name = name;
    this.typeName = "location";
    this.name = name;
  }
  matches(value) {
    return {
      success: /^([~^]{0,1}(-\d)?(\d*)?(\.(\d+))?)$/.test(value),
      value
    };
  }
  fail(_value) {
    return `Value needs to be a valid number, value can include: [~,^]`;
  }
};
var BooleanArgumentType = class {
  constructor(name = "boolean") {
    this.name = name;
    this.typeName = "boolean";
    this.name = name;
  }
  matches(value) {
    return {
      success: Boolean(value?.match(/^(true|false)$/)?.[0]),
      value: value == "true" ? true : false
    };
  }
  fail(value) {
    return `"${value}" can be either "true" or "false"`;
  }
};
var PlayerArgumentType = class {
  constructor(name = "player") {
    this.name = name;
    this.typeName = "Player";
    this.name = name;
  }
  matches(value) {
    return {
      success: fetch(value) ? true : false,
      value: fetch(value)
    };
  }
  fail(value) {
    return `player: "${value}", is not in this world`;
  }
};
var TargetArgumentType = class {
  constructor(name = "target") {
    this.name = name;
    this.typeName = "Target";
    this.name = name;
  }
  matches(value) {
    return {
      success: Boolean(value?.match(/^(@.|"[\s\S]+")$/)?.[0]),
      value
    };
  }
  fail(value) {
    return `${value} is not a valid target`;
  }
};
var ArrayArgumentType = class {
  constructor(name = "array", types) {
    this.name = name;
    this.types = types;
    this.typeName = "string";
    this.name = name;
    this.types = types;
    this.typeName = types.join(" | ").replace(/(.{25})..+/, "$1...");
  }
  matches(value) {
    return {
      success: this.types.includes(value),
      value
    };
  }
  fail(value) {
    return `"${value}" must be one of these values: ${this.types.join(" | ")}`;
  }
};
var DurationArgumentType = class {
  constructor(name) {
    this.name = name;
    this.typeName = "Duration";
  }
  matches(value) {
    return {
      success: /^(\d+[hdysmw],?)+$/.test(value),
      value
    };
  }
  fail(value) {
    return `"${value}" must be a value like "10d" or "3s" the first part is the length second is unit`;
  }
};
var PlayerNameArgumentType = class {
  constructor(name = "playerName") {
    this.name = name;
    this.typeName = "playerName";
    this.name = name;
  }
  matches(value) {
    const player = TABLES.ids.get(value);
    return {
      success: player ? true : false,
      value
    };
  }
  fail(value) {
    return `player: "${value}" has never played this world before! Tip: if the name has spaces in it use quotes around name!`;
  }
};
var ArgumentTypes = {
  string: StringArgumentType,
  int: IntegerArgumentType,
  float: FloatArgumentType,
  location: LocationArgumentType,
  boolean: BooleanArgumentType,
  player: PlayerArgumentType,
  target: TargetArgumentType,
  array: ArrayArgumentType,
  duration: DurationArgumentType,
  playerName: PlayerNameArgumentType
};

// src/lib/Command/Callback.ts
var CommandCallback = class {
  constructor(data) {
    this.data = data;
    this.data = data;
    this.sender = data.sender;
  }
};

// src/lib/Command/utils.ts
function getChatAugments(message, prefix) {
  const match = message.slice(prefix.length).trim().match(/"[^"]+"|[^\s]+/g);
  if (!match)
    return [];
  return match.map((e2) => e2.replace(/"(.+)"/, "$1").toString());
}
function commandNotFound(player, command2) {
  player.sendMessage({
    rawtext: [
      {
        text: `\xA7c`
      },
      {
        translate: `commands.generic.unknown`,
        with: [`${command2}`]
      }
    ]
  });
}
function noPerm(player, command2) {
  player.sendMessage({
    rawtext: [
      {
        text: command2.data.invalidPermission ? command2.data.invalidPermission : `\xA7cYou do not have permission to use "${command2.data.name}"`
      }
    ]
  });
}
function commandSyntaxFail(player, baseCommand, command2, args, i) {
  player.sendMessage({
    rawtext: [
      {
        text: `\xA7c`
      },
      {
        translate: `commands.generic.syntax`,
        with: [`${PREFIX}${baseCommand.data.name} ${args.slice(0, i).join(" ")}`, args[i] ?? " ", args.slice(i + 1).join(" ")]
      }
    ]
  });
  if (command2.children.length > 1 || !args[i]) {
    const types = command2.children.map((c) => c.type instanceof LiteralArgumentType ? c.type.name : c.type?.typeName);
    player.sendMessage(
      `\xA7c"${args[i] ?? "undefined"}" is not valid! Argument "${[...new Set(command2.children.map((c) => c?.type?.name))][0]}" can be typeof: "${types.join(
        '", "'
      )}"`
    );
  } else {
    player.sendMessage(`\xA7c${command2.children[0]?.type?.fail(args[i])}`);
  }
}
function parseLocationArgs([x, y, z], entity) {
  if (!x || !y || !x)
    return null;
  const viewDirection = entity.getViewDirection();
  const locations = [entity.location.x, entity.location.y, entity.location.z];
  const viewVectors = [viewDirection.x, viewDirection.y, viewDirection.z];
  const a = [x, y, z].map((arg) => {
    const r = parseFloat(arg);
    return isNaN(r) ? 0 : r;
  });
  const b = [x, y, z].map((arg, index) => {
    return arg.includes("~") ? a[index] + locations[index] : arg.includes("^") ? a[index] + viewVectors[index] : a[index];
  });
  return { x: b[0], y: b[1], z: b[2] };
}
function sendCallback(cmdArgs, args, event, baseCommand) {
  const lastArg = args[args.length - 1] ?? baseCommand;
  const argsToReturn = [];
  for (const [i, arg] of args.entries()) {
    if (arg?.type?.name.endsWith("*"))
      continue;
    if (arg.type instanceof LocationArgumentType) {
      argsToReturn.push(parseLocationArgs([cmdArgs[i], cmdArgs[i + 1], cmdArgs[i + 2]], event.sender));
      continue;
    }
    if (arg.type instanceof LiteralArgumentType)
      continue;
    argsToReturn.push(arg?.type?.matches(cmdArgs[i]).value ?? cmdArgs[i]);
  }
  lastArg.callback(new CommandCallback(event), ...argsToReturn);
}

// src/database/PlayerLog.ts
import { world as world4 } from "@minecraft/server";
var PlayerLog = class {
  constructor() {
    this.data = /* @__PURE__ */ new Map();
    world4.afterEvents.playerLeave.subscribe((data) => {
      this.data.delete(data.playerId);
    });
  }
  set(player, value) {
    this.data.set(player.id, value);
  }
  get(player) {
    return this.data.get(player.id);
  }
  has(player) {
    return this.data.has(player.id);
  }
  delete(player) {
    this.data.delete(player.id);
  }
  clear() {
    this.data.clear();
  }
  playerIds() {
    return [...this.data.keys()];
  }
  includes(player) {
    return this.playerIds().includes(player.id);
  }
};

// src/lib/Command/index.ts
var COMMANDS = [];
var commandCooldowns = new PlayerLog();
world5.beforeEvents.chatSend.subscribe((data) => {
  if (!data.message.startsWith(PREFIX))
    return;
  data.cancel = true;
  const args = getChatAugments(data.message, PREFIX);
  const command2 = COMMANDS.find(
    (c) => c.depth == 0 && (c.data.name == args[0] || c.data?.aliases?.includes(args[0]))
  );
  const event = {
    message: data.message,
    sendToTargets: data.sendToTargets,
    sender: data.sender,
    targets: data.getTargets()
  };
  if (!command2)
    return commandNotFound(data.sender, args[0]);
  if (!command2.data?.requires?.(data.sender))
    return noPerm(event.sender, command2);
  if (command2.data?.cooldown) {
    const cooldownData = commandCooldowns.get(data.sender) ?? {};
    if (Object.keys(cooldownData).length == 0) {
      cooldownData[command2.data.name] = Date.now();
      commandCooldowns.set(data.sender, cooldownData);
    } else {
      if (Date.now() - cooldownData[command2.data.name] < command2.data.cooldown) {
        const seconds = Math.abs(
          Math.ceil(
            (Date.now() - (cooldownData[command2.data.name] + command2.data.cooldown)) / 1e3
          )
        );
        return data.sender.sendMessage({
          translate: "commands.default.cooldown",
          with: [command2.data.name, seconds.toString()]
        });
      }
    }
  }
  args.shift();
  const verifiedCommands = [];
  const getArg = (start, i) => {
    if (start.children.length > 0) {
      const arg = start.children.find((v2) => v2.type?.matches(args[i]).success);
      if (!arg && !args[i] && start.callback)
        return void 0;
      if (!arg)
        return commandSyntaxFail(event.sender, command2, start, args, i), "fail";
      if (!arg.data?.requires?.(event.sender))
        return noPerm(event.sender, arg), "fail";
      verifiedCommands.push(arg);
      return getArg(arg, i + 1);
    }
  };
  let v = getArg(command2, 0);
  if (v == "fail")
    return;
  system.run(() => {
    sendCallback(args, verifiedCommands, event, command2);
  });
});

// src/lang/text.ts
var text = {
  "api.name": () => "Smelly API",
  "api.error.unknown": () => "An unknown error has occurred.",
  "api.database.error.table_name": (a, b) => `The display name ${a} is too long for an objective, it can be at most ${b} characters long`,
  "api.utilities.formatter.error.ms": (a) => `${a} is not a string or a number`,
  "api.Providers.form.invalidType": (a, b) => `Type ${a} is not a valid type to add a ${b}`,
  "modules.protections.cps.clickingToFast": () => `You are clicking to fast! Please click slower!`,
  "modules.managers.mute.isMuted": () => `\xA7cYou've been temporarily muted in chat.`,
  "modules.commands.ban.reply": (playerName, duration, reason = "") => `\xA7cBanned \xA7f"\xA7a${playerName}\xA7f" \xA7cfor ${duration} Because: "${reason ?? "No reason Provided"}" \xA7aSuccessfully`,
  "lockdown.kick.message": () => [
    `\xA7cYou have been kicked!`,
    `\xA7aReason: \xA7fServer is currently under LockDown`,
    `\xA7fServer will be up soon, Try to join later`
  ],
  "commands.ban.list.player": (name, reason, expire) => `- "${name}" Because: ${reason}, Expiry ${expire}`,
  "commands.freeze.list.player": (name, reason) => `- "${name}" Because: ${reason}`,
  "commands.mutes.list.player": (name, reason, expire) => `- "${name}" Because: ${reason}, Expiry: ${expire}`,
  "commands.lockdown.confirm": "Are you sure you want to lockdown the server, this will kick all active players and all players who try to join who are not admin"
};

// src/lib/Command/Command.ts
var Command = class {
  constructor(data, type, depth = 0, parent) {
    this.data = data;
    this.type = type;
    this.depth = depth;
    this.parent = parent;
    if (!data.requires)
      data.requires = () => true;
    this.data = data;
    this.type = type ?? new LiteralArgumentType(this.data.name);
    this.children = [];
    this.depth = depth;
    this.parent = parent;
    this.callback = null;
    COMMANDS.push(this);
  }
  argument(type) {
    const cmd = new Command(
      this.data,
      type,
      this.depth + 1,
      this
    );
    this.children.push(cmd);
    return cmd;
  }
  string(name) {
    return this.argument(new StringArgumentType(name));
  }
  int(name, range) {
    return this.argument(new IntegerArgumentType(name, range));
  }
  array(name, types) {
    return this.argument(new ArrayArgumentType(name, types));
  }
  boolean(name) {
    return this.argument(new BooleanArgumentType(name));
  }
  location(name) {
    const cmd = this.argument(new LocationArgumentType(name));
    if (!name.endsWith("*")) {
      const newArg = cmd.location(name + "_y*").location(name + "_z*");
      return newArg;
    }
    return cmd;
  }
  literal(data) {
    const cmd = new Command(
      data,
      new LiteralArgumentType(data.name),
      this.depth + 1,
      this
    );
    this.children.push(cmd);
    return cmd;
  }
  executes(callback) {
    this.callback = callback;
    return this;
  }
};

// src/lib/Form/Models/MessageForm.ts
import { FormCancelationReason, MessageFormData } from "@minecraft/server-ui";

// src/config/form.ts
var TIMEOUT_THRESHOLD = 200;

// src/lib/Form/Models/MessageForm.ts
var MessageForm = class {
  constructor(title, body) {
    this.title = title;
    this.body = body;
    this.form = new MessageFormData();
    if (title)
      this.form.title(title);
    if (body)
      this.form.body(body);
    this.triedToShow = 0;
  }
  setButton1(text2, callback) {
    this.button1 = { text: text2, callback };
    this.form.button1(text2);
    return this;
  }
  setButton2(text2, callback) {
    this.button2 = { text: text2, callback };
    this.form.button2(text2);
    return this;
  }
  show(player, onUserClosed) {
    this.triedToShow = 0;
    this.form.show(player).then((response) => {
      if (response.canceled) {
        if (response.cancelationReason == FormCancelationReason.UserBusy) {
          if (this.triedToShow > TIMEOUT_THRESHOLD)
            return player.sendMessage({
              translate: "forms.actionForm.show.timeout"
            });
          this.triedToShow++;
          this.show(player, onUserClosed);
        }
        if (response.cancelationReason == FormCancelationReason.UserClosed)
          onUserClosed?.();
        return;
      }
      if (response.selection == 0)
        this.button1?.callback?.();
      if (response.selection == 1)
        this.button2?.callback?.();
    });
  }
  forceShow(player, onUserClosed) {
    this.form.show(player).then((response) => {
      if (response.canceled) {
        if (response.cancelationReason == FormCancelationReason.UserBusy) {
          this.forceShow(player, onUserClosed);
        }
        if (response.cancelationReason == FormCancelationReason.UserClosed)
          onUserClosed?.();
        return;
      }
      if (response.selection == 0)
        this.button1?.callback?.();
      if (response.selection == 1)
        this.button2?.callback?.();
    });
  }
};

// src/lib/Form/utils.ts
function confirmAction(player, action, onConfirm, onCancel = () => {
}) {
  new MessageForm("Confirm To Continue", action).setButton1("Confirm", onConfirm).setButton2("Never Mind", onCancel).show(player, onCancel);
}

// src/utils.ts
import {
  GameMode,
  MinecraftDimensionTypes,
  Player as Player4,
  system as system2,
  Vector,
  world as world6
} from "@minecraft/server";

// src/config/region.ts
var DEFAULT_REGION_PERMISSIONS = {
  doorsAndSwitches: true,
  openContainers: true,
  pvp: false,
  allowedEntities: [
    "minecraft:player",
    "minecraft:npc",
    "minecraft:item",
    "rubedo:inventory",
    "rubedo:database"
  ]
};
var DOORS_SWITCHES = [
  "minecraft:acacia_door",
  "minecraft:acacia_trapdoor",
  "minecraft:acacia_button",
  "minecraft:birch_door",
  "minecraft:birch_trapdoor",
  "minecraft:birch_button",
  "minecraft:crimson_door",
  "minecraft:crimson_trapdoor",
  "minecraft:crimson_button",
  "minecraft:dark_oak_door",
  "minecraft:dark_oak_trapdoor",
  "minecraft:dark_oak_button",
  "minecraft:jungle_door",
  "minecraft:jungle_trapdoor",
  "minecraft:jungle_button",
  "minecraft:mangrove_door",
  "minecraft:mangrove_trapdoor",
  "minecraft:mangrove_button",
  "minecraft:spruce_door",
  "minecraft:spruce_trapdoor",
  "minecraft:spruce_button",
  "minecraft:warped_door",
  "minecraft:warped_trapdoor",
  "minecraft:warped_button",
  "minecraft:wooden_door",
  "minecraft:wooden_button",
  "minecraft:trapdoor",
  "minecraft:iron_door",
  "minecraft:iron_trapdoor",
  "minecraft:polished_blackstone_button",
  "minecraft:lever"
];
var BLOCK_CONTAINERS = [
  "minecraft:chest",
  "minecraft:ender_chest",
  "minecraft:barrel",
  "minecraft:trapped_chest",
  "minecraft:dispenser",
  "minecraft:dropper",
  "minecraft:furnace",
  "minecraft:blast_furnace",
  "minecraft:lit_furnace",
  "minecraft:lit_blast_furnace",
  "minecraft:hopper",
  "minecraft:shulker_box",
  "minecraft:undyed_shulker_box",
  "minecraft:lit_smoker",
  "minecraft:smoker"
];

// src/modules/models/Region.ts
var REGIONS = [];
var REGIONS_HAVE_BEEN_GRABBED = false;
var LOWEST_Y_VALUE = -64;
var HIGHEST_Y_VALUE = 320;
var Region = class {
  static getAllRegions() {
    if (REGIONS_HAVE_BEEN_GRABBED)
      return REGIONS;
    const regions = TABLES.regions.values().map(
      (region) => new Region(
        region.from,
        region.to,
        region.dimensionId,
        region.permissions,
        region.key
      )
    );
    regions.forEach((r) => {
      REGIONS.push(r);
    });
    REGIONS_HAVE_BEEN_GRABBED = true;
    return regions;
  }
  static vectorInRegion(vector, dimensionId) {
    return this.getAllRegions().find(
      (region) => region.dimensionId == dimensionId && betweenVector3(
        vector,
        { x: region.from.x, y: LOWEST_Y_VALUE, z: region.from.z },
        { x: region.to.x, y: HIGHEST_Y_VALUE, z: region.to.z }
      )
    );
  }
  static async removeRegionAtPosition(vector, dimensionId) {
    const region = this.vectorInRegion(vector, dimensionId);
    if (!region)
      return false;
    return TABLES.regions.delete(region.key);
  }
  constructor(from, to, dimensionId, permissions, key) {
    this.from = from;
    this.to = to;
    this.dimensionId = dimensionId;
    this.permissions = permissions ?? DEFAULT_REGION_PERMISSIONS;
    this.key = key ? key : Date.now().toString();
    if (!key) {
      this.update().then(() => {
        fillBlocksBetween("minecraft:deny" /* Deny */);
        REGIONS.push(this);
      });
    }
  }
  async update() {
    return TABLES.regions.set(this.key, {
      key: this.key,
      from: this.from,
      dimensionId: this.dimensionId,
      permissions: this.permissions,
      to: this.to
    });
  }
  async delete() {
    fillBlocksBetween("minecraft:bedrock" /* Bedrock */);
    REGIONS = REGIONS.filter((r) => r.key != this.key);
    return TABLES.regions.delete(this.key);
  }
  entityInRegion(entity) {
    return this.dimensionId == entity.dimension.id && betweenVector3(
      entity.location,
      { x: this.from.x, y: LOWEST_Y_VALUE, z: this.from.z },
      { x: this.to.x, y: HIGHEST_Y_VALUE, z: this.to.z }
    );
  }
  changePermission(key, value) {
    this.permissions[key] = value;
    this.update();
  }
};

// src/modules/models/Task.ts
var ChangePlayerRoleTask = class {
  static getTasks() {
    return TABLES.tasks.get("changePlayerRole") ?? [];
  }
  static getPlayersRoleToSet(playerName) {
    const tasks = ChangePlayerRoleTask.getTasks();
    return tasks.find((t) => t.playerName == playerName)?.role;
  }
  constructor(playerName, role) {
    let tasks = ChangePlayerRoleTask.getTasks();
    tasks.push({ playerName, role });
    TABLES.tasks.set("changePlayerRole", tasks);
  }
};

// src/config/moderation.ts
var APPEAL_LINK = "https://discord.gg/dMa3A5UYKX";
var FORBIDDEN_ITEMS = [
  "minecraft:beehive" /* Beehive */,
  "minecraft:bee_nest" /* BeeNest */,
  "minecraft:axolotl_bucket" /* AxolotlBucket */,
  "minecraft:cod_bucket" /* CodBucket */,
  "minecraft:tadpole_bucket" /* TadpoleBucket */,
  "minecraft:tropical_fish_bucket" /* TropicalFishBucket */,
  "minecraft:salmon_bucket" /* SalmonBucket */,
  "minecraft:pufferfish_bucket" /* PufferfishBucket */
];
var BANNED_ITEMS = [
  "minecraft:allow" /* Allow */,
  "minecraft:barrier" /* Barrier */,
  "minecraft:border_block" /* BorderBlock */,
  "minecraft:deBug_stick",
  "minecraft:deny" /* Deny */,
  "minecraft:jigsaw" /* Jigsaw */,
  "minecraft:light_block" /* LightBlock */,
  "minecraft:command_block" /* CommandBlock */,
  "minecraft:repeating_command_block" /* RepeatingCommandBlock */,
  "minecraft:chain_command_block" /* ChainCommandBlock */,
  "minecraft:command_block_minecart" /* CommandBlockMinecart */,
  "minecraft:structure_block" /* StructureBlock */,
  "minecraft:structure_void" /* StructureVoid */,
  "minecraft:bedrock" /* Bedrock */,
  "minecraft:end_portal_frame" /* EndPortalFrame */,
  "minecraft:info_update",
  "minecraft:info_update2",
  "minecraft:reserved3",
  "minecraft:reserved4",
  "minecraft:reserved6",
  "minecraft:movingBlock",
  "minecraft:moving_Block",
  "minecraft:movingBlock",
  "minecraft:piston_arm_collision",
  "minecraft:piston_arm_collision",
  "minecraft:pistonarmcollision",
  "minecraft:stickyPistonArmCollision",
  "minecraft:sticky_piston_arm_collision",
  "minecraft:unknown",
  "minecraft:glowingoBsidian",
  "minecraft:invisiBle_Bedrock",
  "minecraft:invisiBleBedrock",
  "minecraft:netherreactor",
  "minecraft:portal",
  "minecraft:fire",
  "minecraft:water",
  "minecraft:lava",
  "minecraft:flowing_lava",
  "minecraft:flowing_water",
  "minecraft:soul_fire"
];
var FORBIDDEN_BLOCKS = [
  "minecraft:dispenser" /* Dispenser */
];
var BANNED_BLOCKS = [
  "minecraft:bedrock" /* Bedrock */,
  "minecraft:barrier" /* Barrier */,
  "minecraft:invisible_bedrock" /* InvisibleBedrock */,
  "minecraft:moving_block" /* MovingBlock */
];
var CONTAINERS = [
  "minecraft:chest" /* Chest */,
  "minecraft:trapped_chest" /* TrappedChest */,
  "minecraft:barrel" /* Barrel */,
  "minecraft:dispenser" /* Dispenser */,
  "minecraft:dropper" /* Dropper */,
  "minecraft:furnace" /* Furnace */,
  "minecraft:lit_furnace" /* LitFurnace */,
  "minecraft:blast_furnace" /* BlastFurnace */,
  "minecraft:lit_blast_furnace" /* LitBlastFurnace */,
  "minecraft:smoker" /* Smoker */,
  "minecraft:lit_smoker" /* LitSmoker */,
  "minecraft:hopper" /* Hopper */,
  "minecraft:shulker_box" /* ShulkerBox */,
  "minecraft:undyed_shulker_box" /* UndyedShulkerBox */
];

// src/config/enchantments.ts
var ENCHANTMENTS = {
  aquaAffinity: 1,
  baneOfArthropods: 5,
  binding: 1,
  blastProtection: 4,
  channeling: 1,
  depthStrider: 3,
  efficiency: 5,
  featherFalling: 4,
  fireAspect: 2,
  fireProtection: 4,
  flame: 1,
  fortune: 3,
  frostWalker: 2,
  impaling: 5,
  infinity: 1,
  knockback: 2,
  looting: 3,
  loyalty: 4,
  luckOfTheSea: 3,
  lure: 3,
  mending: 1,
  multishot: 1,
  piercing: 4,
  power: 5,
  projectileProtection: 4,
  protection: 4,
  punch: 2,
  quickCharge: 3,
  respiration: 3,
  riptide: 3,
  sharpness: 5,
  silkTouch: 1,
  smite: 5,
  soulSpeed: 3,
  swiftSneak: 4,
  thorns: 3,
  unbreaking: 3,
  vanishing: 1
};

// src/utils.ts
var DIMENSIONS = {
  overworld: world6.getDimension(MinecraftDimensionTypes.overworld),
  nether: world6.getDimension(MinecraftDimensionTypes.nether),
  theEnd: world6.getDimension(MinecraftDimensionTypes.theEnd),
  "minecraft:overworld": world6.getDimension(MinecraftDimensionTypes.overworld),
  "minecraft:nether": world6.getDimension(MinecraftDimensionTypes.nether),
  "minecraft:the_end": world6.getDimension(MinecraftDimensionTypes.theEnd)
};
var durations = {
  y: 317098e-16,
  w: 6048e5,
  d: 864e5,
  h: 36e5,
  m: 6e4,
  s: 1e3,
  ms: 1
};
function durationToMs(duration) {
  const values = duration.split(",");
  let ms = 0;
  for (const value of values) {
    const length = parseInt(value.match(/\d+/)[0]);
    const unit = value.match(/[a-zA-Z]+/)[0];
    if (!durations[unit]) {
      throw new Error(`Invalid duration unit: ${unit}`);
    }
    ms += durations[unit] * length;
  }
  return ms;
}
function msToRelativeTime(timeInMilliseconds) {
  const now = new Date().getTime();
  const timeDifference = timeInMilliseconds - now;
  const timeDifferenceAbs = Math.abs(timeDifference);
  const millisecondsInSecond = 1e3;
  const millisecondsInMinute = 60 * millisecondsInSecond;
  const millisecondsInHour = 60 * millisecondsInMinute;
  const millisecondsInDay = 24 * millisecondsInHour;
  const days = Math.floor(timeDifferenceAbs / millisecondsInDay);
  const hours = Math.floor(
    timeDifferenceAbs % millisecondsInDay / millisecondsInHour
  );
  const minutes = Math.floor(
    timeDifferenceAbs % millisecondsInHour / millisecondsInMinute
  );
  const seconds = Math.floor(
    timeDifferenceAbs % millisecondsInMinute / millisecondsInSecond
  );
  if (timeDifference >= 0) {
    if (days > 0) {
      return `in ${days} day${days > 1 ? "s" : ""}`;
    } else if (hours > 0) {
      return `in ${hours} hour${hours > 1 ? "s" : ""}`;
    } else if (minutes > 0) {
      return `in ${minutes} minute${minutes > 1 ? "s" : ""}`;
    } else {
      return `in ${seconds} second${seconds > 1 ? "s" : ""}`;
    }
  } else {
    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else {
      return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
    }
  }
}
function sort3DVectors(vector1, vector2) {
  [vector1.x, vector2.x] = [
    Math.min(vector1.x, vector2.x),
    Math.max(vector1.x, vector2.x)
  ];
  [vector1.y, vector2.y] = [
    Math.min(vector1.y, vector2.y),
    Math.max(vector1.y, vector2.y)
  ];
  [vector1.z, vector2.z] = [
    Math.min(vector1.z, vector2.z),
    Math.max(vector1.z, vector2.z)
  ];
  return [vector1, vector2];
}
function betweenVector3(target, vector1, vector2) {
  const [minVector, maxVector] = sort3DVectors(vector1, vector2);
  const { x, y, z } = target;
  return x >= minVector.x && x <= maxVector.x && y >= minVector.y && y <= maxVector.y && z >= minVector.z && z <= maxVector.z;
}
function kick(player, message = [], onFail) {
  if (isServerOwner(player)) {
    console.warn(`[WARNING]: TRIED TO KICK OWNER`);
    player.sendMessage(`You have been tried to kick, but you cant!`);
    return onFail?.();
  }
  try {
    player.runCommandAsync(`kick "${player.name}" \xA7r${message.join("\n")}`);
    player.triggerEvent("kick");
  } catch (error) {
    player.triggerEvent("kick");
    if (!/"statusCode":-2147352576/.test(error))
      return;
    if (onFail)
      onFail();
  }
}
function getRole(player) {
  if (player instanceof Player4) {
    return TABLES.roles.get(player.name) ?? "member";
  } else {
    return TABLES.roles.get(player) ?? "member";
  }
}
function setRole(player, value) {
  if (typeof player == "string") {
    TABLES.roles.set(player, value);
    const inGamePlayer = [...world6.getPlayers()].find((p) => p.name == player);
    if (inGamePlayer) {
      inGamePlayer.setDynamicProperty("role", value);
    } else {
      new ChangePlayerRoleTask(player, value);
    }
  } else {
    TABLES.roles.set(player.name, value);
    player.setDynamicProperty("role", value);
  }
}
function isServerOwner(player) {
  return world6.getDynamicProperty("worldsOwner") == player.id;
}
function getServerOwner() {
  const id = world6.getDynamicProperty("worldsOwner");
  if (!id || id == "")
    return null;
  return id;
}
function getServerOwnerName() {
  const ownerId = getServerOwner();
  if (!ownerId)
    return null;
  const ids = TABLES.ids.collection();
  return Object.keys(ids).find((key) => ids[key] === ownerId);
}
function setServerOwner(player) {
  if (!player)
    return world6.setDynamicProperty("worldsOwner", "");
  world6.setDynamicProperty("worldsOwner", player.id.toString());
}
function isLockedDown() {
  return world6.getDynamicProperty("isLockDown") ?? false;
}
function setLockDown(val) {
  world6.setDynamicProperty("isLockDown", val);
}
function interpolateVectors(startVector, endVector, step = 1) {
  if (step <= 0 || step > 1) {
    throw new Error(
      "Step size must be between 0 (exclusive) and 1 (inclusive)."
    );
  }
  const interpolatedVectors = [];
  for (let t = 0; t <= 1; t += step) {
    const x = startVector.x + t * (endVector.x - startVector.x);
    const y = startVector.y + t * (endVector.y - startVector.y);
    const z = startVector.z + t * (endVector.z - startVector.z);
    interpolatedVectors.push({ x, y, z });
  }
  return interpolatedVectors;
}
function fillBlocksBetween(blockType) {
  for (const region of Region.getAllRegions()) {
    const loc1 = new Vector(
      region.from.x,
      region.dimensionId == "minecraft:overworld" ? -64 : 0,
      region.from.z
    );
    const loc2 = new Vector(
      region.to.x,
      region.dimensionId == "minecraft:overworld" ? -64 : 0,
      region.to.z
    );
    for (const blockLocation of interpolateVectors(loc1, loc2)) {
      const block = DIMENSIONS[region.dimensionId].getBlock(
        blockLocation
      );
      if (!block)
        continue;
      block.setType(blockType);
    }
  }
}
function getConfigId(id) {
  switch (id) {
    case "banned_items":
      return TABLES.config.get("banned_items") ?? BANNED_ITEMS;
    case "banned_blocks":
      return TABLES.config.get("banned_blocks") ?? BANNED_BLOCKS;
    case "enchantments":
      return TABLES.config.get("enchantments") ?? ENCHANTMENTS;
    case "appealLink":
      return TABLES.config.get("appealLink") ?? APPEAL_LINK;
  }
}
function setConfigId(key, value) {
  TABLES.config.set(key, value);
}

// src/modules/models/Ban.ts
import { Player as Player5 } from "@minecraft/server";

// src/modules/models/Log.ts
var Log = class {
  constructor(data) {
    this.data = data;
    console.warn(`[LOG]: ${data.message}`);
    TABLES.logs.set(Date.now().toString(), data);
  }
};

// src/modules/models/Ban.ts
function setBan(player, id, duration, reason = "No Reason", by = "Rubedo Auto Mod") {
  const playerName = player instanceof Player5 ? player.name : player;
  const data = {
    key: id,
    playerName,
    date: Date.now(),
    duration: duration ? durationToMs(duration) : null,
    expire: duration ? durationToMs(duration) + Date.now() : null,
    reason,
    by
  };
  TABLES.bans.set(id, data);
  new Log({
    message: `${playerName}'s Ban was set by: ${data.by}, to expire: ${msToRelativeTime(data.expire)}, because: ${data.reason}.`,
    playerName
  });
}
var Ban = class {
  constructor(player, duration, reason = "No Reason", by = "Rubedo Auto Mod") {
    if (player instanceof Player5) {
      setBan(player, player.id, duration, reason, by);
    } else {
      setBan(player, TABLES.ids.get(player), duration, reason, by);
    }
  }
};

// src/modules/commands/ban.ts
function ban(ctx, player, duration, reason, by) {
  if (TABLES.bans.get(TABLES.ids.get(player)))
    return ctx.sender.sendMessage(`\xA7c${player} is already banned`);
  ctx.sender.sendMessage(`\xA7aClose chat to confirm`);
  confirmAction(
    ctx.sender,
    `Are you sure you want to ban ${player}, for ${duration ?? "forever"}`,
    () => {
      new Ban(player, duration, reason, ctx.sender.name);
      ctx.sender.sendMessage(
        text["modules.commands.ban.reply"](player, duration, reason)
      );
    }
  );
}
var root = new Command({
  name: "ban",
  description: "Manage bans",
  requires: (player) => ["admin", "moderator"].includes(getRole(player))
});
root.literal({
  name: "add",
  description: "Bans a player"
}).argument(new ArgumentTypes.playerName()).executes((ctx, player) => {
  ban(ctx, player, null, null, ctx.sender.name);
}).argument(new ArgumentTypes.duration("duration")).executes((ctx, player, duration) => {
  ban(ctx, player, duration, null, ctx.sender.name);
}).string("reason").executes((ctx, player, duration, reason) => {
  ban(ctx, player, duration, reason, ctx.sender.name);
});
root.literal({
  name: "remove",
  description: "un-bans a player"
}).argument(new ArgumentTypes.playerName("playerName")).executes((ctx, playerName) => {
  const banData = TABLES.bans.values().find((ban2) => ban2.playerName == playerName);
  if (!banData)
    return ctx.sender.sendMessage(`${playerName} is not banned`);
  if (TABLES.bans.delete(banData.key)) {
    ctx.sender.sendMessage(`\xA7a${playerName}\xA7r has been Unbanned!`);
    new Log({
      message: `${playerName} was Un-Banned by ${ctx.sender}.`,
      playerName
    });
  } else {
    ctx.sender.sendMessage(`\xA7cFailed to un-ban ${playerName}`);
  }
});
root.literal({
  name: "list",
  description: "Lists all bans"
}).executes((ctx) => {
  const bans = TABLES.bans.values();
  if (bans.length == 0)
    return ctx.sender.sendMessage(`\xA7cNo one is banned!`);
  ctx.sender.sendMessage(`\xA72--- Showing Bans (${bans.length}) ---`);
  for (const ban2 of bans) {
    ctx.sender.sendMessage(
      text["commands.ban.list.player"](
        ban2.playerName,
        ban2.reason,
        ban2.expire ? msToRelativeTime(ban2.duration) : "Forever"
      )
    );
  }
});

// src/modules/commands/database.ts
var root2 = new Command({
  name: "database",
  description: "Manages database",
  requires: (player) => player.isOp()
});
root2.literal({
  name: "reload",
  description: "Re-Grabs database data",
  requires: (player) => player.isOp()
}).executes((ctx) => {
  ctx.sender.sendMessage(`Reloaded Database data!`);
});
root2.literal({
  name: "reset",
  description: "Resets all database data!",
  requires: (player) => player.isOp()
}).executes((ctx) => {
  ctx.sender.sendMessage(`\xA7aClose chat to confirm Reset of database.`);
  confirmAction(
    ctx.sender,
    "Are you sure you want to reset all Database Data! This cannot be undone.",
    () => {
      Object.values(TABLES).forEach((t) => t.clear());
      ctx.sender.sendMessage("Reset All Database data!");
      new Log({
        message: `${ctx.sender.name}'s Reset all Database data!`,
        playerName: ctx.sender.name
      });
    }
  );
});
root2.literal({
  name: "resetTable",
  description: "Resets a given table!",
  requires: (player) => player.isOp()
}).array("table", Object.keys(TABLES)).executes((ctx, table) => {
  confirmAction(
    ctx.sender,
    `Are you sure you want to reset all Database Data from table: ${table}! This cannot be undone.`,
    () => {
      TABLES[table].clear();
      ctx.sender.sendMessage("Reset All Database data!");
      new Log({
        message: `${ctx.sender.name}'s Reset all Database data on table: ${table}`,
        playerName: ctx.sender.name
      });
    }
  );
});
root2.literal({
  name: "collection",
  description: "Grabs a collection from a given table!",
  requires: (player) => player.isOp()
}).array("table", Object.keys(TABLES)).executes((ctx, table) => {
  const data = TABLES[table].collection();
  ctx.sender.sendMessage(JSON.stringify(data));
});
root2.literal({
  name: "get",
  description: "Gets the value of a key on a given table.",
  requires: (player) => player.isOp()
}).array("table", Object.keys(TABLES)).string("key").executes((ctx, table, key) => {
  const value = TABLES[table].get(key);
  ctx.sender.sendMessage(
    `Value for key: ${key}, on table: ${table}, is ${value}`
  );
});
root2.literal({
  name: "tableIds",
  description: "Returns a list of all the tableIds",
  requires: (player) => player.isOp()
}).executes((ctx) => {
  ctx.sender.sendMessage(
    `\xA7aCurrent Table Ids:\xA7r
- ${Object.keys(TABLES).join("\n- ")}`
  );
});

// src/modules/commands/ecwipe.ts
new Command({
  name: "ecwipe",
  description: "Clears a players ender chest",
  requires: (player) => getRole(player) == "admin"
}).argument(new ArgumentTypes.player("player")).executes((ctx, player) => {
  for (let i = 0; i < 27; i++) {
    player.runCommandAsync(`replaceitem entity @s slot.enderchest ${i} air`);
  }
  ctx.sender.sendMessage(`\xA7aCleared "${player.name}"'s Ender chest!`);
  new Log({
    message: `${ctx.sender.name}'s wiped ${player.name}'s Ender Chest!`,
    playerName: player.name
  });
});

// src/modules/models/Freeze.ts
var Freeze = class {
  constructor(player, reason = "No Reason") {
    const location = player.location;
    const data = {
      playerName: player.name,
      key: player.id,
      reason,
      location: {
        x: location.x,
        y: location.y,
        z: location.z,
        dimension: player.dimension.id
      }
    };
    TABLES.freezes.set(player.id, data);
  }
};

// src/modules/commands/freeze.ts
import { world as world7 } from "@minecraft/server";
var root3 = new Command({
  name: "freeze",
  description: "Manage Freezes",
  requires: (player) => ["admin", "moderator"].includes(getRole(player))
});
root3.literal({
  name: "add",
  description: "Freezes a player"
}).argument(new ArgumentTypes.player("player")).string("reason").executes((ctx, player, reason) => {
  new Freeze(player, reason);
  ctx.sender.sendMessage(
    `\xA7cFroze \xA7f"\xA7a${player.name}\xA7f" Because: "${reason}" \xA7aSuccessfully`
  );
  player.sendMessage(
    `\xA7cYou have been frozen by \xA7f"\xA7a${ctx.sender.name}\xA7f" Because: "${reason}"`
  );
  player.runCommand(`inputpermission set @s movement disabled`);
  new Log({
    message: `${ctx.sender.name}'s Froze: ${player.name}. Because: ${reason}.`,
    playerName: player.name
  });
});
root3.literal({
  name: "remove",
  description: "unfreezes a player"
}).argument(new ArgumentTypes.playerName("playerName")).executes((ctx, playerName) => {
  const freeze = TABLES.freezes.values().find((freeze2) => freeze2.playerName == playerName);
  if (!freeze)
    return ctx.sender.sendMessage(`${playerName} is not frozen`);
  TABLES.freezes.delete(freeze.key);
  const player = world7.getAllPlayers().find((p) => p.name == playerName);
  if (player)
    player.runCommand(`inputpermission set @s movement enabled`);
  ctx.sender.sendMessage(`\xA7a${playerName}\xA7r has been UnFrozen!`);
  new Log({
    message: `${ctx.sender.name}'s Un-Froze: ${playerName}.`,
    playerName
  });
});
root3.literal({
  name: "list",
  description: "Lists all freezes"
}).executes((ctx) => {
  const freezes = TABLES.freezes.values();
  if (freezes.length == 0)
    return ctx.sender.sendMessage(`\xA7cNo one is frozen!`);
  ctx.sender.sendMessage(`\xA72--- Showing Freezes (${freezes.length}) ---`);
  for (const freeze of freezes) {
    ctx.sender.sendMessage(
      text["commands.freeze.list.player"](freeze.playerName, freeze.reason)
    );
  }
});

// src/modules/commands/help.ts
var CommandNameArgumentType = class {
  constructor(name) {
    this.name = name;
    this.typeName = "CommandName";
  }
  matches(value) {
    return {
      success: Boolean(COMMANDS.find((c) => c.depth == 0 && c.data.name == value)),
      value
    };
  }
  fail(value) {
    return `${value} should be a command name!`;
  }
};
function sendCommandType(baseCommand, args, player) {
  player.sendMessage(
    `${PREFIX}${baseCommand.data.name} ${args.map((a) => a.type ? a.type.typeName == "literal" ? a.data.name : `<${a.type.name}: ${a.type.typeName}>` : null).filter((a) => a).join(" ")}`
  );
}
function sendArguments(bc, c, args, p) {
  if (!c.data?.requires?.(p))
    return;
  if (c.callback) {
    sendCommandType(bc, c.depth == 0 ? args : args.concat(c), p);
  }
  if (c.children.length > 0) {
    for (const child of c.children) {
      sendArguments(bc, child, c.depth == 0 ? args : args.concat(c), p);
    }
  }
}
function sendPageHeader(player, p, maxPages) {
  player.sendMessage({
    rawtext: [
      {
        text: `\xA72--- Showing help page ${p} of ${maxPages} (${PREFIX}help <page: int>) ---`
      }
    ]
  });
}
function getMaxPages(player) {
  const cmds = COMMANDS.filter((c) => c.depth == 0 && c.data?.requires?.(player));
  if (cmds.length == 0)
    return 0;
  return Math.ceil(cmds.length / 5);
}
var root4 = new Command({
  name: "help",
  description: "Provides help/list of commands.",
  aliases: ["?", "h"]
}).executes((ctx) => {
  const maxPages = getMaxPages(ctx.sender);
  const cmds = COMMANDS.filter((c) => c.depth == 0 && (c.data?.requires?.(ctx.sender) ?? false)).slice(1 * 5 - 5, 1 * 5);
  sendPageHeader(ctx.sender, 1, maxPages);
  for (const cmd of cmds) {
    sendArguments(cmd, cmd, [], ctx.sender);
  }
});
root4.int("page").executes((ctx, p) => {
  const maxPages = getMaxPages(ctx.sender);
  if (p > maxPages)
    p = maxPages;
  const cmds = COMMANDS.filter((c) => c.depth == 0 && c.data?.requires?.(ctx.sender)).slice(p * 5 - 5, p * 5);
  sendPageHeader(ctx.sender, p, maxPages);
  for (const cmd of cmds) {
    sendArguments(cmd, cmd, [], ctx.sender);
  }
});
root4.argument(new CommandNameArgumentType("command")).executes((ctx, command2) => {
  const cmd = COMMANDS.filter((c) => c.depth == 0 && c.data.name == command2)[0];
  sendArguments(cmd, cmd, [], ctx.sender);
});

// src/modules/commands/lockdown.ts
import { world as world8 } from "@minecraft/server";
new Command({
  name: "lockdown",
  description: "Toggles the servers lockdown, meaning no one can join",
  requires: (player) => getRole(player) == "admin"
}).executes((ctx) => {
  if (isLockedDown()) {
    setLockDown(false);
    ctx.sender.sendMessage(`\xA7aUnlocked the server!`);
    new Log({
      message: `${ctx.sender.name}'s Unlocked the server.`,
      playerName: ctx.sender.name
    });
  } else {
    ctx.sender.sendMessage(`\xA7aClose chat to confirm lockdown`);
    confirmAction(ctx.sender, text["commands.lockdown.confirm"], () => {
      setLockDown(true);
      for (const player of world8.getPlayers()) {
        if (getRole(player) == "admin")
          continue;
        kick(player, text["lockdown.kick.message"]());
      }
      world8.sendMessage(`\xA7l\xA7cServer is now LOCKED!`);
      new Log({
        message: `${ctx.sender.name}'s Locked the server down.`,
        playerName: ctx.sender.name
      });
    });
  }
});

// src/modules/models/Mute.ts
var Mute = class {
  static getMuteData(player) {
    return TABLES.mutes.get(player.name);
  }
  constructor(player, duration, reason = "No Reason", by = "Rubedo Auto Mod") {
    const msLength = duration ? durationToMs(duration) : null;
    const data = {
      playerName: player.name,
      date: Date.now(),
      duration: msLength,
      expire: msLength ? msLength + Date.now() : null,
      reason,
      by
    };
    TABLES.mutes.set(player.name, data);
  }
};

// src/modules/commands/mute.ts
var root5 = new Command({
  name: "mute",
  description: "Manage Mutes",
  requires: (player) => ["admin", "moderator"].includes(getRole(player))
});
root5.literal({
  name: "add",
  description: "Mutes a player"
}).argument(new ArgumentTypes.player("player")).argument(new ArgumentTypes.duration("duration")).string("reason").executes((ctx, player, duration, reason) => {
  new Mute(player, duration, reason, ctx.sender.name);
  ctx.sender.sendMessage(
    `\xA7cMuted \xA7f"\xA7a${player.name}\xA7f" \xA7cfor ${duration} Because: "${reason}" \xA7aSuccessfully`
  );
  player.sendMessage(
    `\xA7cYou have been muted by \xA7f"${ctx.sender.name}" \xA7cfor ${duration} Because: "${reason}"`
  );
  new Log({
    message: `${ctx.sender.name}'s Muted: ${player.name}. Because: ${reason}.`,
    playerName: player.name
  });
});
root5.literal({
  name: "remove",
  description: "un-mutes a player"
}).argument(new ArgumentTypes.playerName("playerName")).executes((ctx, playerName) => {
  const mute = TABLES.mutes.values().find((mute2) => mute2.playerName == playerName);
  if (!mute)
    return ctx.sender.sendMessage(`${playerName} is not muted!`);
  TABLES.mutes.delete(mute.playerName);
  try {
    ctx.sender.runCommandAsync(`ability "${playerName}" mute false`);
  } catch (error) {
    console.warn(
      `[Warning]: Command '-mute' Cannot fully proceed because command 'ability' does not exist! Please enable Education Edition!`
    );
  }
  ctx.sender.sendMessage(`\xA7a${playerName}\xA7r has been UnMuted!`);
  new Log({
    message: `${ctx.sender.name}'s Un-Muted: ${playerName}.`,
    playerName
  });
});
root5.literal({
  name: "list",
  description: "Lists all freezes"
}).executes((ctx) => {
  const mutes = TABLES.mutes.values();
  if (mutes.length == 0)
    return ctx.sender.sendMessage(`\xA7cNo one is muted!`);
  ctx.sender.sendMessage(`\xA72--- Showing Mutes (${mutes.length}) ---`);
  for (const mute of mutes) {
    ctx.sender.sendMessage(
      text["commands.mutes.list.player"](
        mute.playerName,
        mute.reason,
        mute.expire ? msToRelativeTime(mute.expire) : "Forever"
      )
    );
  }
});

// src/modules/models/Npc.ts
var Npc = class {
  static isValid(entity) {
    if (entity.typeId != "minecraft:npc")
      return false;
    if (NPC_LOCATIONS.find((l) => l == entity.location))
      return true;
    return TABLES.npcs.keys().find((key) => entity.id == key) ? true : false;
  }
  constructor(location, dimension) {
    NPC_LOCATIONS.push(location);
    const entity = dimension.spawnEntity("minecraft:npc", location);
    const data = {
      dimension: entity.dimension.id,
      x: entity.location.x,
      y: entity.location.y,
      z: entity.location.z
    };
    TABLES.npcs.set(entity.id, data);
    clearNpcLocations();
  }
};

// src/modules/commands/npc.ts
new Command({
  name: "npc",
  description: "Spawns a npc at your coordinates",
  requires: (player) => getRole(player) == "admin"
}).executes((ctx) => {
  new Npc(ctx.sender.location, ctx.sender.dimension);
  ctx.sender.sendMessage(`Spawned a verified npc at your current location`);
  new Log({
    message: `${ctx.sender.name}'s Created a new NPC at location: ${JSON.stringify(
      ctx.sender.location
    )} in Dimension: ${ctx.sender.dimension.id}.`,
    playerName: ctx.sender.name
  });
});

// src/modules/commands/ping.ts
import { system as system3 } from "@minecraft/server";
async function getServerTPS() {
  let startTime = Date.now();
  let ticks = 0;
  return new Promise((resolve) => {
    let s = system3.runTimeout(() => {
      if (Date.now() - startTime < 1e3) {
        ticks++;
      } else {
        system3.clearRun(s);
        resolve(ticks);
      }
    });
  });
}
new Command({
  name: "ping",
  description: "Returns the current Ticks Per Second of the servers ping"
}).executes(async (ctx) => {
  let ticks = await getServerTPS();
  ctx.sender.sendMessage(
    `\xA7aCurrent Ticks Per Second: ${ticks > 18 ? "\xA7f{ \xA7aGood" : ticks > 13 ? "\xA7f{ \xA7eOk" : "\xA7f{ \xA7cSevere"} ${ticks} \xA7f}`
  );
});

// src/modules/commands/region.ts
var command = new Command({
  name: "region",
  description: "Create a Region",
  requires: (player) => getRole(player) == "admin"
});
command.literal({
  name: "add",
  description: "Adds a new protection region"
}).int("from_x").int("from_z").int("to_x").int("to_z").executes((ctx, from_x, from_z, to_x, to_z) => {
  new Region(
    { x: from_x, z: from_z },
    { x: to_x, z: to_z },
    ctx.sender.dimension.id
  );
  ctx.sender.sendMessage(
    `Created Region From ${from_x} -64 ${from_z} ${to_x} 320 ${to_z}`
  );
  new Log({
    message: `${ctx.sender.name}'s Created a new Region from [(${from_x}, ${to_x}), (${to_x}, ${to_z})] in dimension: ${ctx.sender.dimension.id}.`,
    playerName: ctx.sender.name
  });
});
command.literal({
  name: "remove",
  description: "Removes a region at the players current position"
}).executes((ctx) => {
  const r = Region.removeRegionAtPosition(
    ctx.sender.location,
    ctx.sender.dimension.id
  );
  if (r) {
    ctx.sender.sendMessage(
      `Removed Region at ${JSON.stringify(ctx.sender.location)}`
    );
    new Log({
      message: `${ctx.sender.name}'s Removed a Region at ${JSON.stringify(
        ctx.sender.location
      )} in dimension: ${ctx.sender.dimension.id}.`,
      playerName: ctx.sender.name
    });
  } else {
    ctx.sender.sendMessage(
      `Failed to find/remove region at ${JSON.stringify(ctx.sender.location)}`
    );
  }
});
command.literal({
  name: "removeAll",
  description: "Removes all regions"
}).executes((ctx) => {
  Region.getAllRegions().forEach((r) => r.delete());
  ctx.sender.sendMessage(`Removed All regions`);
});
command.literal({
  name: "list",
  description: "Lists all regions and positions"
}).executes((ctx) => {
  const regions = Region.getAllRegions();
  for (const region of regions) {
    ctx.sender.sendMessage(
      `Region from ${region.from.x}, ${region.from.z} to ${region.to.x}, ${region.to.z} in dimension ${region.dimensionId}`
    );
  }
  if (regions.length == 0)
    return ctx.sender.sendMessage(`No regions have been made yet`);
});
var permission = command.literal({
  name: "permission",
  description: "Handles permissions for regions"
});
permission.literal({
  name: "set",
  description: "Sets a certain permission on the region the player is currently in to a value"
}).array("key", ["doorsAndSwitches", "openContainers", "pvp"]).boolean("value").executes((ctx, key, value) => {
  const region = Region.vectorInRegion(
    ctx.sender.location,
    ctx.sender.dimension.id
  );
  if (!region)
    return ctx.sender.sendMessage(`You are not in a region`);
  region.changePermission(key, value);
  ctx.sender.sendMessage(`Changed permission ${key} to ${value}`);
});
permission.literal({
  name: "list",
  description: "Lists the permissions for the current region"
}).executes((ctx) => {
  const region = Region.vectorInRegion(
    ctx.sender.location,
    ctx.sender.dimension.id
  );
  if (!region)
    return ctx.sender.sendMessage(`You are not in a region`);
  ctx.sender.sendMessage(
    `Current region permissions ${JSON.stringify(region.permissions)}`
  );
});
var entityCommands = permission.literal({
  name: "entities",
  description: "Holds the subCommands for adding or removing allowedEntities"
});
entityCommands.literal({
  name: "add",
  description: "Adds a entity to the allowed entities list"
}).string("entity").executes((ctx, entity) => {
  const region = Region.vectorInRegion(
    ctx.sender.location,
    ctx.sender.dimension.id
  );
  if (!region)
    return ctx.sender.sendMessage(`You are not in a region`);
  const currentAllowedEntities = region.permissions.allowedEntities;
  currentAllowedEntities.push(entity);
  region.changePermission("allowedEntities", currentAllowedEntities);
  ctx.sender.sendMessage(
    `Added entity ${entity} to the allowed entities of the region your currently standing in`
  );
});
entityCommands.literal({
  name: "remove",
  description: "Removes a entity from the allowed entities in the region"
}).string("entity").executes((ctx, entity) => {
  const region = Region.vectorInRegion(
    ctx.sender.location,
    ctx.sender.dimension.id
  );
  if (!region)
    return ctx.sender.sendMessage(`You are not in a region`);
  let currentAllowedEntities = region.permissions.allowedEntities;
  if (!currentAllowedEntities.includes(entity))
    return ctx.sender.sendMessage(
      `The entity ${entity} is not allowed to enter the region`
    );
  currentAllowedEntities = currentAllowedEntities.filter((v) => v != entity);
  region.changePermission("allowedEntities", currentAllowedEntities);
  ctx.sender.sendMessage(
    `Removed entity ${entity} to the allowed entities of the region your currently standing in`
  );
});

// src/types.ts
var ROLES = /* @__PURE__ */ ((ROLES2) => {
  ROLES2[ROLES2["member"] = 0] = "member";
  ROLES2[ROLES2["admin"] = 1] = "admin";
  ROLES2[ROLES2["moderator"] = 2] = "moderator";
  ROLES2[ROLES2["builder"] = 3] = "builder";
  return ROLES2;
})(ROLES || {});

// src/modules/commands/role.ts
var StringIsNumber = (value) => isNaN(Number(value)) === false;
function ToArray(enumme) {
  return Object.keys(enumme).filter(StringIsNumber).map((key) => enumme[key]);
}
var root6 = new Command({
  name: "role",
  description: "Changes the role for a player",
  requires: (player) => getRole(player) == "admin" || isServerOwner(player)
});
root6.literal({
  name: "set",
  description: "Sets the role for a player"
}).argument(new ArgumentTypes.playerName("playerName")).argument(new ArgumentTypes.array("role", ToArray(ROLES))).executes((ctx, playerName, role) => {
  setRole(playerName, role);
  ctx.sender.sendMessage(`Changed role of ${playerName} to ${role}`);
  new Log({
    message: `${ctx.sender.name} Updated ${playerName}'s role to: ${role}.`,
    playerName
  });
});
root6.literal({
  name: "get",
  description: "Gets the role of a player"
}).argument(new ArgumentTypes.playerName("playerName")).executes((ctx, playerName) => {
  const role = getRole(playerName);
  ctx.sender.sendMessage(`${playerName} has role: ${role}`);
});
var ownerRoot = root6.literal({
  name: "owner",
  description: "Manages the owner"
});
ownerRoot.literal({
  name: "get",
  description: "Gets the owner of the world"
}).executes((ctx) => {
  const ownerId = getServerOwner();
  const ids = TABLES.ids.collection();
  const ownerName = Object.keys(ids).find((key) => ids[key] === ownerId);
  ctx.sender.sendMessage(`\xA7aServer Owner: ${ownerName} (id: ${ownerId})`);
});
ownerRoot.literal({
  name: "transfer",
  description: "Transfers the owner of the world",
  requires: (player) => isServerOwner(player)
}).argument(new ArgumentTypes.player()).executes((ctx, player) => {
  confirmAction(
    ctx.sender,
    `Are you sure you want to transfer the server ownership to ${player.name}, this action is not reversible!`,
    () => {
      setServerOwner(player);
      ctx.sender.sendMessage(
        `\xA7aSet the server Owner to: ${player.name} (id: ${player.id})`
      );
      new Log({
        message: `${ctx.sender.name} Transferred server ownership to ${player.name}.`,
        playerName: player.name
      });
    }
  );
  ctx.sender.sendMessage(`\xA7aClose chat to confirm`);
});
ownerRoot.literal({
  name: "clear",
  description: "clear's the owner of the world",
  requires: (player) => isServerOwner(player)
}).executes((ctx) => {
  confirmAction(
    ctx.sender,
    "Are you sure you want to clear the server owner, this action is not reversible!",
    () => {
      setServerOwner(null);
      ctx.sender.sendMessage(
        `\xA7aCleared the server owner! run "/reload" or reload world to run "/function start" again!`
      );
      new Log({
        message: `${ctx.sender.name} Cleared the servers ownership.`,
        playerName: ctx.sender.name
      });
    }
  );
  ctx.sender.sendMessage(`\xA7aClose chat to confirm`);
});

// src/lib/Form/Models/ModelForm.ts
import { FormCancelationReason as FormCancelationReason2, ModalFormData } from "@minecraft/server-ui";

// src/lib/Form/Models/FormCallback.ts
var FormCallback = class {
  constructor(form, player, callback, formValues) {
    this.form = form;
    this.player = player;
    this.callback = callback;
    this.formValues = formValues;
  }
  error(message) {
    new MessageForm("Error", message).setButton1("Return to form", () => {
      const args = this.form.args;
      this.form.clearForm();
      for (const [i, arg] of args.entries()) {
        switch (arg.type) {
          case "dropdown":
            this.form.addDropdown(arg.label, arg.options, this.formValues[i]);
            break;
          case "slider":
            this.form.addSlider(
              arg.label,
              arg.minimumValue,
              arg.maximumValue,
              arg.valueStep,
              this.formValues[i]
            );
            break;
          case "textField":
            this.form.addTextField(
              arg.label,
              arg.placeholderText,
              this.formValues[i]
            );
            break;
          case "toggle":
            this.form.addToggle(arg.label, this.formValues[i]);
          default:
            break;
        }
      }
      this.form.show(this.player, this.callback);
    }).setButton2("Cancel").show(this.player);
  }
};

// src/lib/Form/Models/ModelForm.ts
var ModalForm = class {
  constructor(title) {
    this.title = title;
    this.form = new ModalFormData();
    if (title)
      this.form.title(title);
    this.args = [];
  }
  clearForm() {
    this.form = new ModalFormData();
    this.args = [];
  }
  addDropdown(label, options, defaultValueIndex) {
    this.args.push({ type: "dropdown", options });
    this.form.dropdown(label, options, defaultValueIndex);
    return this;
  }
  addSlider(label, minimumValue, maximumValue, valueStep, defaultValue) {
    this.args.push({
      type: "slider",
      label,
      minimumValue,
      maximumValue,
      valueStep
    });
    this.form.slider(
      label,
      minimumValue,
      maximumValue,
      valueStep,
      defaultValue
    );
    return this;
  }
  addToggle(label, defaultValue) {
    this.args.push({ type: "toggle", label });
    this.form.toggle(label, defaultValue);
    return this;
  }
  addTextField(label, placeholderText, defaultValue) {
    this.args.push({
      type: "textField",
      label,
      placeholderText
    });
    this.form.textField(label, placeholderText, defaultValue);
    return this;
  }
  show(player, callback, onUserClosed) {
    this.triedToShow = 0;
    this.form.show(player).then((response) => {
      if (response.canceled) {
        if (response.cancelationReason == FormCancelationReason2.UserBusy) {
          if (this.triedToShow > TIMEOUT_THRESHOLD)
            return player.sendMessage({
              translate: "forms.actionForm.show.timeout"
            });
          this.triedToShow++;
          this.show(player, callback, onUserClosed);
        }
        if (response.cancelationReason == FormCancelationReason2.UserClosed)
          onUserClosed?.();
        return;
      }
      if (!response.formValues)
        return;
      callback(
        new FormCallback(this, player, callback, response.formValues),
        ...response.formValues.map(
          (v, i) => this.args[i].type == "dropdown" ? this.args[i].options?.[v] : v
        )
      );
    });
  }
  forceShow(player, callback, onUserClosed) {
    this.form.show(player).then((response) => {
      if (response.canceled) {
        if (response.cancelationReason == FormCancelationReason2.UserBusy) {
          this.forceShow(player, callback, onUserClosed);
        }
        if (response.cancelationReason == FormCancelationReason2.UserClosed)
          onUserClosed?.();
        return;
      }
      if (!response.formValues)
        return;
      callback(
        new FormCallback(this, player, callback, response.formValues),
        ...response.formValues.map(
          (v, i) => this.args[i].type == "dropdown" ? this.args[i].options?.[v] : v
        )
      );
    });
  }
};

// src/lib/Form/Models/ActionForm.ts
import { ActionFormData, FormCancelationReason as FormCancelationReason3 } from "@minecraft/server-ui";
var ActionForm = class {
  constructor(title, body) {
    this.title = title;
    this.body = body;
    this.form = new ActionFormData();
    if (title)
      this.form.title(title);
    if (body)
      this.form.body(body);
    this.buttons = [];
    this.triedToShow = 0;
  }
  addButton(text2, iconPath, callback, locked) {
    this.buttons.push({
      text: text2,
      iconPath,
      callback
    });
    if (typeof text2 == "string") {
      text2 = (locked ? " " : "") + text2;
    } else {
      text2.text = (locked ? " " : "") + text2.text;
    }
    this.form.button(text2, iconPath);
    return this;
  }
  show(player, onUserClosed) {
    this.triedToShow = 0;
    this.form.show(player).then((response) => {
      if (response.canceled) {
        if (response.cancelationReason == FormCancelationReason3.UserBusy) {
          if (this.triedToShow > TIMEOUT_THRESHOLD)
            return player.sendMessage({
              translate: "forms.actionForm.show.timeout"
            });
          this.triedToShow++;
          this.show(player, onUserClosed);
        }
        if (response.cancelationReason == FormCancelationReason3.UserClosed)
          onUserClosed?.();
        return;
      }
      if (response.selection != null)
        this.buttons[response.selection].callback?.();
    });
  }
  forceShow(player, onUserClosed) {
    this.form.show(player).then((response) => {
      if (response.canceled) {
        if (response.cancelationReason == FormCancelationReason3.UserBusy) {
          this.forceShow(player, onUserClosed);
        }
        if (response.cancelationReason == FormCancelationReason3.UserClosed)
          onUserClosed?.();
        return;
      }
      if (response.selection != null)
        this.buttons[response.selection].callback?.();
    });
  }
};

// src/modules/forms/settings.ts
function manageBannedItemsForm(player) {
  new ActionForm("Manage Banned Items").addButton("Remove a Banned Item", null, () => {
    removeBannedItemForm(player);
  }).addButton("Ban an item", null, () => {
    addBannedItemForm(player);
  }).show(player);
}
function removeBannedItemForm(player) {
  new ModalForm("Remove Banned Items").addDropdown("Select item to remove", getConfigId("banned_items")).show(player, (ctx, item) => {
    let items = getConfigId("banned_items");
    items = items.filter((p) => p != item);
    setConfigId("banned_items", items);
    player.sendMessage(`Removed Banned item "${item}"`);
    new Log({
      message: `${player.name} unbanned the item: ${item}.`,
      playerName: player.name
    });
  });
}
function addBannedItemForm(player) {
  new ModalForm("Add Banned Item").addTextField("Item Id", "minecraft:string").show(player, (ctx, item) => {
    let items = getConfigId("banned_items");
    if (items.includes(item))
      return ctx.error(`\xA7cItem "${item}" is already banned`);
    items.push(item);
    setConfigId("banned_items", items);
    player.sendMessage(`Banned the item "${item}"`);
    new Log({
      message: `${player.name} banned the item: ${item}.`,
      playerName: player.name
    });
  });
}
function manageBannedBlocksForm(player) {
  new ActionForm("Manage Banned Blocks").addButton("Remove a Banned Block", null, () => {
    removeBannedBlockForm(player);
  }).addButton("Ban an block", null, () => {
    addBannedBlockForm(player);
  }).show(player);
}
function removeBannedBlockForm(player) {
  new ModalForm("Remove Banned Block").addDropdown("Select block to remove", getConfigId("banned_blocks")).show(player, (ctx, block) => {
    let blocks = getConfigId("banned_blocks");
    blocks = blocks.filter((p) => p != block);
    setConfigId("banned_blocks", blocks);
    player.sendMessage(`Removed Banned block "${block}"`);
    new Log({
      message: `${player.name} unbanned the block: ${block}.`,
      playerName: player.name
    });
  });
}
function addBannedBlockForm(player) {
  new ModalForm("Add Banned Block").addTextField("Block Id", "minecraft:barrier").show(player, (ctx, block) => {
    let blocks = getConfigId("banned_blocks");
    if (blocks.includes(block))
      return ctx.error(`\xA7cBlock "${block}" is already banned`);
    blocks.push(block);
    setConfigId("banned_blocks", blocks);
    player.sendMessage(`Banned the block "${block}"`);
    new Log({
      message: `${player.name} banned the block: ${block}.`,
      playerName: player.name
    });
  });
}
function manageEnchantmentLevelsForm(player) {
  new ModalForm("Manage Enchantment Levels").addDropdown("Enchantment to change", Object.keys(ENCHANTMENTS), 0).addTextField("Level (number)", "5").show(player, (ctx, enchantment, levelString) => {
    if (isNaN(levelString))
      return ctx.error(
        `\xA7c"${levelString}" is not a number, please enter a value like, "3", "9", etc.`
      );
    const level = parseInt(levelString);
    let enchants = getConfigId("enchantments");
    enchants[enchantment] = level;
    setConfigId("enchantments", enchants);
    player.sendMessage(`Set max level for ${enchantment} to ${level}`);
    new Log({
      message: `${player.name} set max enchant level for ${enchantment} to ${level}.`,
      playerName: player.name
    });
  });
}
function manageAppealLinkForm(player) {
  new ModalForm("Manage Appeal Link").addTextField("Appeal Link", APPEAL_LINK).show(player, (ctx, link) => {
    setConfigId("appealLink", link);
    player.sendMessage(`Changed the servers appeal link to ${link}`);
    new Log({
      message: `${player.name} changed server appeal link to: ${link}.`,
      playerName: player.name
    });
  });
}

// src/protections.ts
var PROTECTIONS = {};
TABLES.protections.onLoad(() => {
  for (const protection4 of Object.values(PROTECTIONS)) {
    if (!protection4.getConfig().enabled)
      continue;
    protection4.enable();
  }
});

// src/modules/forms/automod.ts
function showAutoModHomeForm(player) {
  const form = new ActionForm("Manage Protections");
  for (const protection4 of Object.values(PROTECTIONS)) {
    form.addButton(protection4.name, protection4.iconPath, () => {
      showProtectionConfig(protection4, player);
    });
  }
  form.addButton("Back", "textures/ui/arrow_dark_left_stretch.png", () => {
    showHomeForm(player);
  }).show(player);
}
function showProtectionConfig(protection4, player) {
  const data = protection4.getConfig();
  const form = new ModalForm(
    `Manage ${protection4.name} Protection Config`
  ).addToggle("Enabled", data["enabled"]);
  let keys = [];
  for (const [key, value] of Object.entries(protection4.configDefault)) {
    keys.push(key);
    if (typeof value.defaultValue == "boolean") {
      form.addToggle(value.description, data[key]);
    } else if (typeof value.defaultValue == "number") {
      form.addSlider(value.description, 0, 100, 1, data[key]);
    } else {
      form.addTextField(value.description, null, data[key]);
    }
  }
  form.show(player, (ctx, enabled, ...keys2) => {
    if (enabled != data["enabled"]) {
      if (enabled)
        protection4.enable();
      if (!enabled)
        protection4.disable();
    }
    let config = {
      enabled
    };
    for (const [i, key] of Object.keys(protection4.configDefault).entries()) {
      config[key] = keys2[i];
    }
    protection4.setConfig(config);
    player.sendMessage(`Updated config for ${protection4.name}!`);
    new Log({
      message: `${player.name} updated config for protection: ${protection4.name}.`,
      playerName: player.name
    });
  });
}

// src/modules/forms/home.ts
function showHomeForm(player) {
  new ActionForm("Rubedo Settings").addButton("Auto Mod", "textures/ui/permissions_op_crown.png", () => {
    showAutoModHomeForm(player);
  }).addButton("Banned items", "textures/blocks/sculk_shrieker_top.png", () => {
    manageBannedItemsForm(player);
  }).addButton("Banned blocks", "textures/blocks/barrier.png", () => {
    manageBannedBlocksForm(player);
  }).addButton("Enchantments", "textures/items/book_enchanted.png", () => {
    manageEnchantmentLevelsForm(player);
  }).addButton("Appeal Link", "textures/ui/Feedback.png", () => {
    manageAppealLinkForm(player);
  }).show(player);
}

// src/modules/commands/settings.ts
new Command({
  name: "settings",
  description: "Opens up the settings menu for the player",
  requires: (player) => ["admin", "moderator"].includes(getRole(player))
}).executes((ctx) => {
  showHomeForm(ctx.sender);
  ctx.sender.sendMessage(`\xA7aForm request sent, close chat to continue!`);
});

// src/modules/commands/vanish.ts
import { world as world9 } from "@minecraft/server";
function vanish(player, say) {
  if (player.hasTag(`spectator`)) {
    player.runCommandAsync(`gamemode c`);
    player.triggerEvent(`removeSpectator`);
    player.removeTag(`spectator`);
    if (!say)
      return;
    world9.sendMessage({
      rawtext: [
        {
          translate: "multiplayer.player.joined",
          with: [`\xA7e${player.name}`]
        }
      ]
    });
  } else {
    player.runCommandAsync(`gamemode spectator`);
    player.triggerEvent(`addSpectator`);
    player.addTag(`spectator`);
    if (!say)
      return;
    world9.sendMessage({
      rawtext: [
        {
          translate: "multiplayer.player.left",
          with: [`\xA7e${player.name}`]
        }
      ]
    });
  }
}
new Command({
  name: "vanish",
  description: "Toggles Vanish Mode on the sender",
  requires: (player) => getRole(player) == "admin"
}).executes((ctx) => {
  vanish(ctx.sender, false);
  new Log({
    message: `${ctx.sender.name} vanished.`,
    playerName: ctx.sender.name
  });
}).boolean("say").executes((ctx, say) => {
  vanish(ctx.sender, say);
  new Log({
    message: `${ctx.sender.name} vanished, hidden: ${say}.`,
    playerName: ctx.sender.name
  });
});

// src/config/app.ts
var VERSION = "3.0.0-beta";

// src/modules/commands/version.ts
new Command({
  name: "version",
  description: "Get Current Rubedo Version",
  aliases: ["v"]
}).executes((ctx) => {
  ctx.sender.sendMessage(`Current Rubedo Version: ${VERSION}`);
});

// src/modules/commands/kick.ts
new Command({
  name: "kick",
  description: "Kicks a player from the game",
  requires: (player) => getRole(player) == "admin"
}).argument(new ArgumentTypes.player()).string("reason").executes((ctx, player, reason) => {
  kick(player, [reason]);
  ctx.sender.sendMessage(`\xA7aKicked ${player.name} from the world`);
  new Log({
    message: `${ctx.sender.name}'s Kicked: ${player.name} from the world. Because: ${reason}.`,
    playerName: player.name
  });
});

// src/modules/commands/log.ts
var root7 = new Command({
  name: "log",
  description: "Manages the log command",
  requires: (player) => getRole(player) == "admin"
});
root7.literal({
  name: "add",
  description: "Adds a new log"
}).string("message").executes((ctx, message) => {
  new Log({ message });
  ctx.sender.sendMessage(`\xA7aAdded new log: ${message}`);
});
root7.literal({
  name: "getAll",
  description: "Gets all logs sorted in descending"
}).int("page").array("order", ["ascending", "descending"]).executes((ctx, page, order) => {
  const allLogs = Object.entries(TABLES.logs.collection()).sort(
    (a, b) => order == "ascending" ? parseInt(b[0]) - parseInt(a[0]) : parseInt(a[0]) - parseInt(b[0])
  );
  if (allLogs.length == 0)
    return ctx.sender.sendMessage(`\xA7cNo Logs have been made!`);
  const maxPages = Math.ceil(allLogs.length / 8);
  if (page > maxPages)
    page = maxPages;
  ctx.sender.sendMessage(
    `\xA72--- Showing logs page ${page} of ${maxPages} (${PREFIX}log getAll <page: int>) ---`
  );
  for (const [key, value] of allLogs.slice(page * 8 - 8, page * 8)) {
    ctx.sender.sendMessage(
      `${msToRelativeTime(parseInt(key))}: ${value.message}`
    );
  }
});
root7.literal({
  name: "getPlayersLogs",
  description: "Gets all logs associated with a player"
}).argument(new ArgumentTypes.playerName()).int("page").array("order", ["ascending", "descending"]).executes((ctx, playerName, page, order) => {
  const allLogs = Object.entries(TABLES.logs.collection()).filter((v) => v[1].playerName == playerName).sort(
    (a, b) => order == "ascending" ? parseInt(b[0]) - parseInt(a[0]) : parseInt(a[0]) - parseInt(b[0])
  );
  if (allLogs.length == 0)
    return ctx.sender.sendMessage(`\xA7cNo Logs exists for "${playerName}"!`);
  const maxPages = Math.ceil(allLogs.length / 8);
  if (page > maxPages)
    page = maxPages;
  ctx.sender.sendMessage(
    `\xA72--- Showing logs for "${playerName}" page ${page} of ${maxPages} ---`
  );
  for (const [key, value] of allLogs.slice(page * 8 - 8, page * 8)) {
    ctx.sender.sendMessage(
      `${msToRelativeTime(parseInt(key))}: ${value.message}`
    );
  }
});
root7.literal({
  name: "getProtectionLogs",
  description: "Gets all logs associated with a protection"
}).string("protection").int("page").array("order", ["ascending", "descending"]).executes((ctx, protection4, page, order) => {
  const allLogs = Object.entries(TABLES.logs.collection()).filter((v) => v[1].protection == protection4).sort(
    (a, b) => order == "ascending" ? parseInt(b[0]) - parseInt(a[0]) : parseInt(a[0]) - parseInt(b[0])
  );
  if (allLogs.length == 0)
    return ctx.sender.sendMessage(
      `\xA7cNo Logs exists for protection: "${protection4}"!`
    );
  const maxPages = Math.ceil(allLogs.length / 8);
  if (page > maxPages)
    page = maxPages;
  ctx.sender.sendMessage(
    `\xA72--- Showing logs for Protection: "${protection4}" page ${page} of ${maxPages} ---`
  );
  for (const [key, value] of allLogs.slice(page * 8 - 8, page * 8)) {
    ctx.sender.sendMessage(
      `${msToRelativeTime(parseInt(key))}: ${value.message}`
    );
  }
});
root7.literal({
  name: "clearAll",
  description: "Clears all logs"
}).executes((ctx) => {
  TABLES.logs.clear();
  ctx.sender.sendMessage(`\xA7aCleared All logs!`);
  new Log({
    message: `${ctx.sender.name}'s Cleared all server logs.`,
    playerName: ctx.sender.name
  });
});

// src/modules/events/beforeDataDrivenEntityTriggerEvent.ts
import { Player as Player7, world as world10 } from "@minecraft/server";
var e = world10.afterEvents.dataDrivenEntityTriggerEvent.subscribe((data) => {
  if (!(data.entity instanceof Player7))
    return;
  if (data.id != "rubedo:becomeAdmin")
    return;
  data.entity.removeTag("CHECK_PACK");
  const serverOwnerName = getServerOwnerName();
  if (serverOwnerName) {
    data.entity.playSound("note.bass");
    data.entity.sendMessage(
      `\xA7cFailed to give server owner: "${serverOwnerName}" is already owner!`
    );
    return world10.beforeEvents.dataDrivenEntityTriggerEvent.unsubscribe(e);
  }
  setRole(data.entity, "admin");
  setServerOwner(data.entity);
  data.entity.runCommandAsync(`camera @s fade time 1 1 1`);
  data.entity.sendMessage(
    `\xA7aYou have now been set as the "owner" of this server. The command "/function start" will not do anything anymore, type "-help" for more information!`
  );
});

// src/modules/events/playerSpawn.ts
import { world as world11 } from "@minecraft/server";
world11.afterEvents.playerSpawn.subscribe(({ player }) => {
  TABLES.ids.onLoad(() => {
    if (isLockedDown() && getRole(player) != "admin")
      return kick(player, text["lockdown.kick.message"]());
    if (Mute.getMuteData(player))
      player.runCommandAsync(`ability @s mute true`);
    if (!TABLES.ids.has(player.name)) {
      TABLES.ids.set(player.name, player.id);
      new Log({
        message: `New Player: ${player.name}, Joined the World.`,
        playerName: player.name
      });
    }
    const roleToSet = ChangePlayerRoleTask.getPlayersRoleToSet(player.name);
    if (roleToSet)
      setRole(player, roleToSet);
  });
});

// src/modules/managers/ban.ts
import { world as world12 } from "@minecraft/server";
world12.afterEvents.playerSpawn.subscribe((data) => {
  TABLES.ids.onLoad(() => {
    const { player } = data;
    const banData = TABLES.bans.get(player.id);
    if (!banData)
      return;
    if (banData.expire && banData.expire < Date.now())
      return TABLES.bans.delete(player.id);
    kick(
      player,
      [
        `\xA7cYou have been banned!`,
        `\xA7aReason: \xA7f${banData.reason}`,
        `\xA7fExpiry: \xA7b${banData.expire ? msToRelativeTime(banData.expire - Date.now()) : "Forever"}`,
        `\xA7fAppeal at: \xA7b${getConfigId("appealLink")}`
      ],
      () => {
        console.warn(new Error("Failed to kick player"));
        TABLES.bans.delete(player.id);
      }
    );
    new Log({
      message: `Banned Player: ${player.name} tried to join the world during his ban duration.`,
      playerName: player.name
    });
  });
});

// src/lib/Events/beforeChat.ts
import { world as world13 } from "@minecraft/server";
var CALLBACKS = {};
world13.beforeEvents.chatSend.subscribe((data) => {
  if (data.message.startsWith(PREFIX))
    return;
  for (const callback of Object.values(CALLBACKS)) {
    callback.callback(data);
  }
});
var beforeChat = class {
  static subscribe(callback) {
    const key = Date.now();
    CALLBACKS[key] = { callback };
    return key;
  }
  static unsubscribe(key) {
    delete CALLBACKS[key];
  }
};

// src/modules/managers/mute.ts
beforeChat.subscribe((data) => {
  const muteData = Mute.getMuteData(data.sender);
  if (!muteData)
    return;
  if (muteData.expire && muteData.expire < Date.now())
    return TABLES.mutes.delete(data.sender.name);
  data.cancel = true;
  data.sender.sendMessage(text["modules.managers.mute.isMuted"]());
  new Log({
    message: `${data.sender.name} tried to send a message while muted: ${data.message}`,
    playerName: data.sender.name
  });
});

// src/modules/managers/region.ts
import { system as system5, world as world15 } from "@minecraft/server";

// src/lib/Events/forEachPlayer.ts
import { system as system4, world as world14 } from "@minecraft/server";
var CALLBACKS2 = {};
system4.runInterval(() => {
  const players = [...world14.getPlayers()];
  const playerEntires = players.entries();
  for (const [i, player] of playerEntires) {
    const callbacks = Object.values(CALLBACKS2);
    for (const CALLBACK of callbacks) {
      if (CALLBACK.delay != 0 && system4.currentTick - CALLBACK.lastCall < CALLBACK.delay)
        continue;
      CALLBACK.callback(player);
      if (i == players.length - 1)
        CALLBACK.lastCall = system4.currentTick;
    }
  }
});
var forEachPlayer = class {
  static subscribe(callback, delay = 0) {
    const key = Object.keys(CALLBACKS2).length;
    CALLBACKS2[key] = { callback, delay, lastCall: 0 };
    return key;
  }
  static unsubscribe(key) {
    delete CALLBACKS2[key];
  }
};

// src/modules/managers/region.ts
var onUseDelay = new PlayerLog();
system5.runTimeout(() => {
  fillBlocksBetween("minecraft:deny" /* Deny */);
}, 6e3);
world15.beforeEvents.playerInteractWithBlock.subscribe((data) => {
  const { player, block } = data;
  if (["moderator", "admin"].includes(getRole(player)))
    return;
  if (player.isOp())
    return;
  if (Date.now() - (onUseDelay.get(player) ?? 0) < 100) {
    data.cancel = true;
    return;
  }
  onUseDelay.set(player, Date.now());
  const region = Region.vectorInRegion(block.location, block.dimension.id);
  if (!region)
    return;
  if (DOORS_SWITCHES.includes(block.typeId) && region.permissions.doorsAndSwitches)
    return;
  if (BLOCK_CONTAINERS.includes(block.typeId) && region.permissions.openContainers)
    return;
  data.cancel = true;
  system5.run(() => {
    if (!player.isValid())
      return;
    player.playSound("note.bass");
    player.sendMessage("\xA7cYou cannot interact with blocks in this region!");
  });
});
world15.beforeEvents.playerPlaceBlock.subscribe((data) => {
  const { player, dimension, block } = data;
  if (["moderator", "admin"].includes(getRole(player)))
    return;
  if (player.isOp())
    return;
  const region = Region.vectorInRegion(block.location, dimension.id);
  if (!region)
    return;
  data.cancel = true;
  system5.run(() => {
    if (!player.isValid())
      return;
    player.playSound("note.bass");
    player.sendMessage(`\xA7cYou cannot place blocks in this region!`);
  });
});
world15.beforeEvents.playerBreakBlock.subscribe((data) => {
  const { player, dimension, block } = data;
  if (["moderator", "admin"].includes(getRole(player)))
    return;
  if (player.isOp())
    return;
  if (Date.now() - (onUseDelay.get(player) ?? 0) < 200) {
    data.cancel = true;
    return;
  }
  onUseDelay.set(player, Date.now());
  const region = Region.vectorInRegion(block.location, dimension.id);
  if (!region)
    return;
  data.cancel = true;
  system5.run(() => {
    if (!player.isValid())
      return;
    player.playSound("note.bass");
    player.sendMessage(`\xA7cYou cannot break blocks in this region!`);
  });
});
world15.beforeEvents.explosion.subscribe((data) => {
  const impactedBlocks = data.getImpactedBlocks();
  const allowedBlocks = [];
  for (const block of impactedBlocks) {
    const region = Region.vectorInRegion(block.location, data.dimension.id);
    if (region)
      continue;
    allowedBlocks.push(block);
  }
  data.setImpactedBlocks(allowedBlocks);
});
world15.afterEvents.entitySpawn.subscribe(async ({ entity }) => {
  const region = Region.vectorInRegion(entity.location, entity.dimension.id);
  if (!region)
    return;
  if (region.permissions.allowedEntities.includes(entity.typeId))
    return;
  entity.remove();
});
TABLES.regions.onLoad(() => {
  system5.runInterval(async () => {
    const regions = Region.getAllRegions();
    const dimEntities = {};
    Object.keys(DIMENSIONS).filter((k) => k.startsWith("minecraft:")).forEach((k) => {
      dimEntities[k] = DIMENSIONS[k].getEntities();
    });
    for (const region of regions) {
      const entities = dimEntities[region.dimensionId];
      for (const entity of entities) {
        if (region.permissions.allowedEntities.includes(entity.typeId))
          continue;
        if (!region.entityInRegion(entity))
          continue;
        entity.remove();
      }
    }
  }, 20 * 5);
  forEachPlayer.subscribe((player) => {
    const regions = Region.getAllRegions();
    for (const region of regions) {
      if (region.entityInRegion(player)) {
        player.addTag(`inRegion`);
        if (!region.permissions.pvp)
          player.addTag(`region-protected`);
      } else {
        player.removeTag(`inRegion`);
        player.removeTag(`region-protected`);
      }
    }
  }, 5);
});

// src/modules/protections/gamemode.ts
import { GameMode as GameMode2, world as world17 } from "@minecraft/server";

// src/modules/models/Protection.ts
import { system as system6, world as world16 } from "@minecraft/server";
var Protection = class {
  constructor(name, description, iconPath, isEnabledByDefault) {
    this.name = name;
    this.description = description;
    this.iconPath = iconPath;
    this.isEnabledByDefault = isEnabledByDefault;
    this.name = name;
    this.description = description;
    this.iconPath = iconPath;
    this.configDefault = {};
    this.isEnabled = false;
    this.isEnabledByDefault = isEnabledByDefault;
    this.events = {};
    this.schedules = [];
    this.forEachPlayers = [];
    PROTECTIONS[this.name] = this;
  }
  setConfigDefault(data) {
    this.configDefault = data;
    TABLES.protections.hasSync(this.name).then((v) => {
      if (v)
        return;
      let saveData = {
        enabled: true
      };
      for (const key of Object.keys(data)) {
        saveData[key] = data[key].defaultValue;
      }
      TABLES.protections.set(this.name, saveData);
    });
    return this;
  }
  getConfig() {
    let config = TABLES.protections.get(this.name);
    if (!config)
      config = { enabled: this.isEnabled };
    return config;
  }
  async setConfig(data) {
    return TABLES.protections.set(this.name, data);
  }
  triggerChange(enabled) {
    if (enabled) {
      this.isEnabled = true;
      this.onEnableCallback?.();
      for (const [key, value] of Object.entries(this.events)) {
        if (value.triggered)
          continue;
        let callback = world16.beforeEvents[key].subscribe(
          value.callback
        );
        value.triggered = true;
        value.callback = callback;
      }
      for (const v of this.forEachPlayers) {
        if (v.key)
          continue;
        let key = forEachPlayer.subscribe(v.callback, v.delay);
        v.key = key;
      }
      for (const v of this.schedules) {
        if (v.runScheduleId)
          continue;
        let runScheduleId = system6.runInterval(v.callback);
        v.runScheduleId = runScheduleId;
      }
    } else {
      this.isEnabled = false;
      this.onDisableCallback?.();
      for (const [key, value] of Object.entries(this.events)) {
        if (!value.triggered)
          continue;
        world16.events[key].unsubscribe(value.callback);
        value.triggered = false;
      }
      for (const v of this.forEachPlayers) {
        if (!v.key)
          continue;
        forEachPlayer.unsubscribe(v.key);
        v.key = null;
      }
      for (const v of this.schedules) {
        if (!v.runScheduleId)
          continue;
        system6.clearRun(v.runScheduleId);
        v.runScheduleId = null;
      }
    }
  }
  onEnable(callback) {
    this.onEnableCallback = callback;
    return this;
  }
  onDisable(callback) {
    this.onDisableCallback = callback;
    return this;
  }
  subscribe(id, callback) {
    this.events[id] = {
      callback,
      triggered: false
    };
    return this;
  }
  runSchedule(callback, tickInterval) {
    this.schedules.push({
      callback,
      tickInterval,
      runScheduleId: null
    });
    return this;
  }
  forEachPlayer(callback, delay = 0) {
    this.forEachPlayers.push({
      callback,
      delay,
      key: null
    });
    return this;
  }
  enable() {
    this.triggerChange(true);
  }
  disable() {
    this.triggerChange(false);
  }
};

// src/modules/protections/gamemode.ts
var ILLEGAL_GAMEMODE = GameMode2.creative;
var ViolationCount = new PlayerLog();
var protection = new Protection(
  "gamemode",
  "Blocks illegal gamemode",
  "textures/ui/creative_icon.png",
  true
).setConfigDefault({
  clearPlayer: {
    description: "Whether to clear players inventory.",
    defaultValue: true
  },
  setToSurvival: {
    description: "If player should be set to survival after being flagged.",
    defaultValue: true
  },
  banPlayer: {
    description: "If player should be banned after violation count is met.",
    defaultValue: false
  },
  violationCount: {
    description: "The amount of violations before ban.",
    defaultValue: 0
  }
});
protection.runSchedule(() => {
  const config = protection.getConfig();
  const players = world17.getPlayers({ gameMode: ILLEGAL_GAMEMODE });
  for (const player of players) {
    if (["moderator", "admin", "builder"].includes(getRole(player)))
      continue;
    try {
      if (config.setToSurvival)
        player.runCommandAsync(`gamemode s`);
      if (config.clearPlayer)
        player.runCommandAsync(`clear @s`);
    } catch (error) {
    }
    new Log({
      playerName: player.name,
      protection: "Gamemode",
      message: `${player.name} has entered into a illegal gamemode!`
    });
    const count = (ViolationCount.get(player) ?? 0) + 1;
    ViolationCount.set(player, count);
    if (config.banPlayer && count >= config.violationCount)
      new Ban(player, null, "Illegal Gamemode");
  }
}, 20);

// src/modules/protections/nuker.ts
import { world as world18 } from "@minecraft/server";
var log = new PlayerLog();
var IMPOSSIBLE_BREAK_TIME = 15;
var VALID_BLOCK_TAGS = [
  "snow",
  "lush_plants_replaceable",
  "azalea_log_replaceable",
  "minecraft:crop",
  "fertilize_area",
  "plant"
];
var IMPOSSIBLE_BREAKS = [
  "minecraft:water",
  "minecraft:flowing_water",
  "minecraft:lava",
  "minecraft:flowing_lava",
  "minecraft:bedrock"
];
var ViolationCount2 = new PlayerLog();
var beforeBlockBreakKey;
var protection2 = new Protection(
  "nuker",
  "Blocks block breaking too fast",
  "textures/blocks/dirt.png",
  true
).setConfigDefault({
  banPlayer: {
    description: "If the player should be banned once violation count is met",
    defaultValue: false
  },
  violationCount: {
    description: "Violations before ban",
    defaultValue: 0
  }
});
protection2.onEnable(() => {
  const config = protection2.getConfig();
  beforeBlockBreakKey = world18.beforeEvents.playerBreakBlock.subscribe(
    (data) => {
      if (["moderator", "admin"].includes(getRole(data.player)))
        return;
      if (data.block.getTags().some((tag) => VALID_BLOCK_TAGS.includes(tag)))
        return;
      const old = log.get(data.player);
      log.set(data.player, Date.now());
      if (!old)
        return;
      if (!IMPOSSIBLE_BREAKS.includes(data.block.typeId)) {
        if (old < Date.now() - IMPOSSIBLE_BREAK_TIME)
          return;
        const count = (ViolationCount2.get(data.player) ?? 0) + 1;
        ViolationCount2.set(data.player, count);
        new Log({
          message: `${data.player.name} has a updated nuker violation count of: ${count}.`,
          playerName: data.player.name
        });
        if (config.banPlayer && count >= config.violationCount)
          new Ban(data.player, null, "Using Nuker");
      }
      data.cancel = true;
    }
  );
}).onDisable(() => {
  world18.beforeEvents.playerBreakBlock.unsubscribe(beforeBlockBreakKey);
});

// src/modules/protections/spam.ts
var previousMessage = new PlayerLog();
var ViolationCount3 = new PlayerLog();
var protection3 = new Protection(
  "spam",
  "Blocks spam in chat",
  "textures/ui/mute_on.png",
  false
).setConfigDefault({
  permMutePlayer: {
    description: "If player should be permanently muted once violation count is met.",
    defaultValue: false
  },
  violationCount: {
    description: "Violation count before permanent mute",
    defaultValue: 0
  },
  repeatedMessages: {
    description: "Blocks repeated messages",
    defaultValue: true
  },
  zalgo: {
    description: "Blocks zalgo",
    defaultValue: true
  }
});
protection3.subscribe("chatSend", (data) => {
  try {
    if (data.message.startsWith(PREFIX))
      return;
    if (["admin", "moderator"].includes(getRole(data.sender)))
      return;
    const config = protection3.getConfig();
    const isSpam = () => {
      const count = (ViolationCount3.get(data.sender) ?? 0) + 1;
      ViolationCount3.set(data.sender, count);
      new Log({
        message: `${data.sender.name} has a updated spam violation count of: ${count}.`,
        playerName: data.sender.name
      });
      if (config.permMutePlayer && count >= config.violationCount)
        new Mute(data.sender, null, "Spamming");
    };
    if (config.repeatedMessages && previousMessage.get(data.sender) == data.message) {
      data.cancel = true;
      isSpam();
      new Log({
        message: `${data.sender.name} has sent repeated messages.`,
        playerName: data.sender.name
      });
      return data.sender.sendMessage(`\xA7cRepeated message detected!`);
    }
    if (config.zalgo && /%CC%/g.test(encodeURIComponent(data.message))) {
      data.cancel = true;
      isSpam();
      new Log({
        message: `${data.sender.name} has sent zalgo messages.`,
        playerName: data.sender.name
      });
      return data.sender.sendMessage(
        `\xA7cYou message contains some type of zalgo and cannot be sent!`
      );
    }
    previousMessage.set(data.sender, data.message);
  } catch (error) {
    console.warn(error + error.stack);
  }
});

// src/index.ts
var database = new DynamicProperty(
  "db",
  "object"
).setWorldDynamic(true);
system7.beforeEvents.watchdogTerminate.subscribe((data) => {
  data.cancel = true;
  console.warn(`WATCHDOG TRIED TO CRASH = ${data.terminateReason}`);
});
var NPC_LOCATIONS = [];
function clearNpcLocations() {
  NPC_LOCATIONS = [];
}
export {
  NPC_LOCATIONS,
  clearNpcLocations,
  database
};
