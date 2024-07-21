import { creepConfig } from "../creepConfig";
import { isNull, isUndefined } from "lodash";

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    // eslint-disable-next-line no-bitwise
    const r = (Math.random() * 16) | 0;
    // eslint-disable-next-line no-bitwise
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface spawnCreepContext {
  getRoom: () => Room;
  getSources: () => Source[];
  addSpawnTask: (task: SpawnTask) => void;
  peekConstructTask: () => ConstructTask | null;
  getNumCreepInSpawnQueueByRole: (role: string) => number;
  getNumCreepInSpawnQueueByPosition: (pos: RoomPosition) => number;
}

const creepRoleRoomMapping: Map<Room, Map<string, Set<Creep>>> = new Map();
const creepBoundMapping: Map<RoomPosition, Set<Creep>> = new Map();

export function createCreepController(context: creepControllerContext) {
  const preprocess = () => {
    for (const [creepName, creep] of Object.entries(Game.creeps)) {
      // init creepRoleRoomMapping
      const room = Game.rooms[creep.memory.spawnedRoom];
      if (creepRoleRoomMapping.has(room)) {
        const creepRoleMapping = creepRoleRoomMapping.get(room)!;
        if (creepRoleMapping.has(creep.memory.role)) {
          const creepSet = creepRoleMapping.get(creep.memory.role)!;
          creepSet.add(creep);
        } else {
          creepRoleMapping.set(creep.memory.role, new Set([creep]));
        }
      } else {
        const creepRoleMapping = new Map<string, Set<Creep>>();
        creepRoleMapping.set(creep.memory.role, new Set([creep]));
        creepRoleRoomMapping.set(room, creepRoleMapping);
      }

      // init creepBoundMapping
      const pos = creep.memory.boundPos;
      if (!isUndefined(pos)) {
        if (creepBoundMapping.has(pos!)) {
          const creepSet = creepBoundMapping.get(pos!);
          creepSet!.add(creep);
        } else {
          creepBoundMapping.set(pos!, new Set<Creep>([creep]));
        }
      }
    }
  };

  const getCreepsByRole = (room: Room, role: string): Creep[] => {
    if (!creepRoleRoomMapping.has(room)) return [];
    const creepRoleMapping = creepRoleRoomMapping.get(room)!;
    if (!creepRoleMapping.has(role)) return [];
    return Array.from(creepRoleMapping.get(role)!);
  };

  const getCreepNumByRole = (room: Room, role: string): number => {
    if (!creepRoleRoomMapping.has(room)) return 0;
    const creepRoleMapping = creepRoleRoomMapping.get(room)!;
    if (!creepRoleMapping.has(role)) return 0;
    return creepRoleMapping.get(role)!.size;
  };

  const getCreepsByPosition = (pos: RoomPosition): Creep[] => {
    if (creepBoundMapping.has(pos)) return Array.from(creepBoundMapping.get(pos)!);
    return [];
  };

  const getCreepNumByPosition = (pos: RoomPosition): number => {
    if (creepBoundMapping.has(pos)) return creepBoundMapping.get(pos)!.size;
    return 0;
  };

  const spawnCreeps = (contextFn: spawnCreepContext) => {
    const room = contextFn.getRoom();
    // check harvest creep
    {
      const sources = contextFn.getSources();
      for (const source of sources) {
        const position = source.pos;
        const aliveCreeps = getCreepsByPosition(position);
        const aliveCreepNum = aliveCreeps.length;
        const creepNum = aliveCreepNum + contextFn.getNumCreepInSpawnQueueByPosition(position);
        if (creepNum > 1) continue;
        if (aliveCreepNum === 0) continue;
        const creep = aliveCreeps[0];
        const ttl = creep.ticksToLive;
        if (!isUndefined(ttl)) {
          if (ttl! < creepConfig.HARVEST_CREEP_REPLACE_TTL) {
            contextFn.addSpawnTask({
              bodies: creepConfig.HARVEST_CREEP_BODY,
              costs: creepConfig.HARVEST_CREEP_BODY_COST,
              role: creepConfig.HARVEST_CREEP_ROLE,
              priority: creepConfig.HARVEST_CREEP_PRIORITY,
              name: `${creepConfig.HARVEST_CREEP_ROLE}_${uuid()}`,
              boundPos: position,
              postTime: 0
            });
          }
        }
      }
    }
    // check upgrade creep
    {
      const controller = room.controller!;
      const position = controller.pos;
      const aliveCreeps = getCreepsByPosition(position);
      const aliveCreepNum = aliveCreeps.length;
      const creepNum = aliveCreepNum + contextFn.getNumCreepInSpawnQueueByPosition(position);
      if (creepNum < creepConfig.UPGRADE_CREEP_LIMIT[controller.level]) {
        contextFn.addSpawnTask({
          bodies: creepConfig.UPGRADE_CREEP_BODY,
          costs: creepConfig.UPGRADE_CREEP_BODY_COST,
          role: creepConfig.UPGRADE_CREEP_ROLE,
          priority: creepConfig.UPGRADE_CREEP_PRIORITY,
          name: `${creepConfig.UPGRADE_CREEP_ROLE}_${uuid()}`,
          boundPos: position,
          postTime: 0
        });
      }
    }
    // check express creep
    {
      const aliveCreeps = getCreepsByRole(room, creepConfig.EXPRESS_CREEP_ROLE);
      const creepNum = aliveCreeps.length + contextFn.getNumCreepInSpawnQueueByRole(creepConfig.EXPRESS_CREEP_ROLE);
      if (creepNum < (room.controller!.level > 4 ? 2 : 3)) {
        contextFn.addSpawnTask({
          bodies: creepConfig.EXPRESS_CREEP_BODY,
          costs: creepConfig.EXPRESS_CREEP_BODY_COST,
          role: creepConfig.EXPRESS_CREEP_ROLE,
          priority: creepConfig.EXPRESS_CREEP_PRIORITY,
          name: `${creepConfig.EXPRESS_CREEP_ROLE}_${uuid()}`,
          postTime: 0
        });
      }
    }
    // check construct creep
    {
      const aliveCreeps = getCreepsByRole(room, creepConfig.CONSTRUCT_CREEP_ROLE);
      const creepNum = aliveCreeps.length + contextFn.getNumCreepInSpawnQueueByRole(creepConfig.CONSTRUCT_CREEP_ROLE);
      if (isNull(contextFn.peekConstructTask) && creepNum < creepConfig.CONSTRUCT_CREEP_NUM[room.controller!.level]) {
        contextFn.addSpawnTask({
          bodies: creepConfig.CONSTRUCT_CREEP_BODY,
          costs: creepConfig.CONSTRUCT_CREEP_BODY_COST,
          role: creepConfig.CONSTRUCT_CREEP_ROLE,
          priority: creepConfig.CONSTRUCT_CREEP_PRIORITY,
          name: `${creepConfig.CONSTRUCT_CREEP_ROLE}_${uuid()}`,
          postTime: 0
        });
      }
    }
  };

  return {
    preprocess,
    getCreepsByRole,
    getCreepNumByRole,
    getCreepsByPosition,
    spawnCreeps
  };
}
