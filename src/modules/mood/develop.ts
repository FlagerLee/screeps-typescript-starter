import { CARRIER, CreepType, getCreepCost, HARVESTER } from "../creeps/CreepAPI";

export function updateFallback(room: Room) {
  let fallback = false;
  // use fallback creep config when
  // 1. creep carrier is dead, or
  // 2. creep harvester is dead
  for (const task of room.memory.sq) {
    if (task.name.startsWith(CARRIER)) {
      fallback = true;
      break;
    } else if (task.name.startsWith(HARVESTER)) {
      // TODO: add timer, when harvester is in spawnQueue more than 50 ticks, fallback
    }
  }

  if (fallback) {
    // use fallback
    room.memory.fb = true;
    // calculate remaining energy in extensions and spawns
    let energy_amount = 0;
    for (const extension of room.extension) {
      energy_amount += extension.store.energy;
    }
    let min_energy = 10000;
    for (const spawn of room.spawn) {
      min_energy = Math.min(min_energy, spawn.store.energy);
    }
    room.memory.fbc = Math.max(min_energy + energy_amount, 300);
  } else {
    room.memory.fb = false;
    room.memory.fbc = -1;
  }
}

function getSRReadyNum(room: Room) {
  let srs = room.memory.sr;
  let num = 0;
  for (let sr of srs) {
    let r = Game.rooms[sr];
    if (!r) continue;
    let memory = r.memory as unknown as SRMemory;
    if (memory.ready) num += memory.numSource;
  }
  return num;
}

const CreepDict = {
  HARVESTER: {
    getConfigIndex: function (room: Room): number {
      let index = 0;
      const num_ext = room.extension.length;
      if (room.controller!.level == 1) index = 0;
      else if (num_ext < 5) index = 1;
      else if (num_ext < 10) index = 2;
      else index = 3;
      // check fallback
      if (room.memory.fb) {
        for (; index >= 1; index--) {
          if (getCreepCost(this.CONFIG[index].body) <= room.memory.fbc) break;
        }
      }
      return index;
    },
    getNum: function (room: Room): number {
      if (room.controller!.level == 1 && room.memory.cq.length > 0) return 0;
      if (room.name == "sim") {
        return 2; // simulation only
      }
      return room.source.length;
    },
    CONFIG: [
      { body: [WORK, MOVE] }, // before source bounded container is built
      { body: [WORK, WORK, MOVE, MOVE] }, // cost 300 energy, used before extension is built
      { body: [WORK, WORK, WORK, WORK, MOVE, MOVE] }, // cost 500 energy
      { body: [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE] } // cost 650 energy, perfect form
    ]
  },
  CENTER_CARRIER: {
    getConfigIndex: function (room: Room): number {
      let index = 0;
      if (room.controller!.level == 1) index = 0;
      else if (room.extension.length < 20) index = 1;
      else index = 2;
      // check fallback
      if (room.memory.fb) {
        for (; index >= 0; index--) {
          if (getCreepCost(this.CONFIG[index].body) <= room.memory.fbc) break;
        }
      }
      return index;
    },
    getNum: function (room: Room): number {
      // try to find center container
      const structures = room.lookForAt(LOOK_STRUCTURES, room.memory.center.x, room.memory.center.y);
      if (structures.length == 0) return 0;
      else {
        let num = 0;
        if (room.name == "sim") num = 2;
        else num = room.source.length;
        if (room.extension.length < 20) return num * 2;
        else return num;
      }
    },
    CONFIG: [
      { body: [CARRY, CARRY, MOVE, MOVE] },
      { body: [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE] },
      { body: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE] }
    ]
  },
  CARRIER: {
    getConfigIndex: function (room: Room): number {
      // TODO: implement
      let index = 0;
      if (room.controller!.level == 1) index = 0;
      else if (room.extension.length < 30) index = 1;
      else index = 2;
      if (room.memory.fb) {
        for (; index >= 0; index--) {
          if (getCreepCost(this.CONFIG[index].body) <= room.memory.fbc) break;
        }
      }
      return index;
    },
    getNum: function (room: Room): number {
      // try to find center container
      const structures = room.lookForAt(LOOK_STRUCTURES, room.memory.center.x, room.memory.center.y);
      if (structures.length == 0) return 0;
      else return 1;
    },
    CONFIG: [
      { body: [CARRY, MOVE] },
      { body: [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE] },
      { body: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE] }
    ]
  },
  REPAIRER: {
    getConfigIndex: function (room: Room): number {
      // TODO: implement
      if (room.extension.length < 10) return 0;
      return 1;
    },
    getNum: function (room: Room): number {
      return room.memory.rq.length == 0 ? 0 : 1;
    },
    CONFIG: [
      { body: [CARRY, CARRY, MOVE, MOVE, WORK] },
      { body: [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE] }
    ]
  },
  UPGRADER: {
    getConfigIndex: function (room: Room): number {
      // TODO: implement
      if (room.controller!.level == 1 || room.extension.length < 5) return 0;
      if (room.extension.length < 20) return 1;
      return 2;
    },
    getNum: function (room: Room): number {
      const controller = room.controller;
      if (!controller) return 0;
      if (room.memory.cq.length != 0) {
        if (controller.ticksToDowngrade < 3500) return 1;
        return 0;
      }
      switch (controller.level) {
        case 0:
        case 1:
        case 8:
          return 1;
        case 5:
          return 3;
        default:
          return 4;
      }
    },
    CONFIG: [
      { body: [WORK, CARRY, MOVE] },
      { body: [WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE] },
      { body: [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE] }
    ]
  },
  CONSTRUCTOR: {
    getConfigIndex: function (room: Room): number {
      // TODO: implement
      if (room.controller!.level == 1) return 0;
      if (room.extension.length <= 10) return 1;
      if (room.extension.length < 20) return 2;
      return 3;
    },
    getNum: function (room: Room): number {
      if (room.memory.cq.length == 0) return 0;
      // TODO: implement
      if (room.controller!.level == 1) return 3;
      if (room.controller!.level > 4) return 1;
      else return 2;
    },
    CONFIG: [
      { body: [WORK, CARRY, MOVE] },
      { body: [WORK, WORK, CARRY, MOVE] },
      { body: [WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE] }, // cost 550
      {
        body: [
          WORK,
          WORK,
          WORK,
          WORK,
          CARRY,
          CARRY,
          CARRY,
          CARRY,
          CARRY,
          CARRY,
          CARRY,
          CARRY,
          MOVE,
          MOVE,
          MOVE,
          MOVE,
          MOVE,
          MOVE,
          MOVE
        ]
      } // cost 1150
    ]
  },
  RESERVER: {
    getConfigIndex: function (room: Room): number {
      return 0;
    },
    getNum: function (room: Room): number {
      if (room.extension.length < 30) return 0;
      return room.memory.sr.length;
    },
    CONFIG: [
      { body: [CLAIM, CLAIM, MOVE, MOVE] } // cost 1300
    ]
  },
  SRHARVESTER: {
    getConfigIndex: function (room: Room): number {
      return 0;
    },
    getNum: function (room: Room): number {
      return getSRReadyNum(room);
    },
    CONFIG: [{ body: [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE] }]
  },
  SRCARRIER: {
    getConfigIndex: function (room: Room): number {
      return 0;
    },
    getNum: function (room: Room): number {
      return getSRReadyNum(room);
    },
    CONFIG: [
      {
        body: [...Array(4).fill(WORK), ...Array(12).fill(CARRY), ...Array(8).fill(MOVE)]
      }
    ]
  },
  SRDEFENDER: {
    getConfigIndex: function (room: Room): number {
      return 0;
    },
    getNum: function (room: Room): number {
      return 0;
      // let numDefender = 0;
      // for (let srName of room.memory.sr) {
      //   let room = Game.rooms[srName];
      //   if (!room) continue;
      //   let mem = room.memory as unknown as SRMemory;
      //   if (mem.hasInvader) numDefender++;
      // }
      // return numDefender;
    },
    CONFIG: [
      {
        body: [...Array(10).fill(TOUGH), ...Array(15).fill(MOVE), ...Array(6).fill(RANGED_ATTACK), MOVE]
      }
    ]
  }
};

export const DevelopConfig = {
  creep: {
    getCreepConfig: (creepType: CreepType, room: Room): { body: BodyPartConstant[] } => {
      switch (creepType) {
        case CreepType.HARVESTER: {
          let roleConfig = CreepDict.HARVESTER;
          return roleConfig.CONFIG[roleConfig.getConfigIndex(room)];
        }
        case CreepType.CCARRIER: {
          let roleConfig = CreepDict.CENTER_CARRIER;
          return roleConfig.CONFIG[roleConfig.getConfigIndex(room)];
        }
        case CreepType.CARRIER: {
          let roleConfig = CreepDict.CARRIER;
          return roleConfig.CONFIG[roleConfig.getConfigIndex(room)];
        }
        case CreepType.REPAIRER: {
          let roleConfig = CreepDict.REPAIRER;
          return roleConfig.CONFIG[roleConfig.getConfigIndex(room)];
        }
        case CreepType.UPGRADER: {
          let roleConfig = CreepDict.UPGRADER;
          return roleConfig.CONFIG[roleConfig.getConfigIndex(room)];
        }
        case CreepType.CONSTRUCTOR: {
          let roleConfig = CreepDict.CONSTRUCTOR;
          return roleConfig.CONFIG[roleConfig.getConfigIndex(room)];
        }
        case CreepType.RESERVER: {
          let roleConfig = CreepDict.RESERVER;
          return roleConfig.CONFIG[roleConfig.getConfigIndex(room)];
        }
        case CreepType.SRHARVESTER: {
          let roleConfig = CreepDict.SRHARVESTER;
          return roleConfig.CONFIG[roleConfig.getConfigIndex(room)];
        }
        case CreepType.SRCARRIER: {
          let roleConfig = CreepDict.SRCARRIER;
          return roleConfig.CONFIG[roleConfig.getConfigIndex(room)];
        }
        case CreepType.SRDEFENDER: {
          let roleConfig = CreepDict.SRDEFENDER;
          return roleConfig.CONFIG[roleConfig.getConfigIndex(room)];
        }
        default:
          throw new Error(`[DEVELOP CONFIG] Unknown creep type ${creepType} in function getCreepConfig`);
      }
    },
    getCreepNum: (creepType: CreepType, room: Room): number => {
      switch (creepType) {
        case CreepType.HARVESTER:
          return CreepDict.HARVESTER.getNum(room);
        case CreepType.CCARRIER:
          return CreepDict.CENTER_CARRIER.getNum(room);
        case CreepType.CARRIER:
          return CreepDict.CARRIER.getNum(room);
        case CreepType.REPAIRER:
          return CreepDict.REPAIRER.getNum(room);
        case CreepType.UPGRADER:
          return CreepDict.UPGRADER.getNum(room);
        case CreepType.CONSTRUCTOR:
          return CreepDict.CONSTRUCTOR.getNum(room);
        case CreepType.RESERVER:
          return CreepDict.RESERVER.getNum(room);
        case CreepType.SRHARVESTER:
          return CreepDict.SRHARVESTER.getNum(room);
        case CreepType.SRCARRIER:
          return CreepDict.SRCARRIER.getNum(room);
        case CreepType.SRDEFENDER:
          return CreepDict.SRDEFENDER.getNum(room);
        default:
          throw new Error(`[DEVELOP CONFIG] Unknown creep type ${creepType} in function getCreepNum`);
      }
    }
  }
};

function generateBodyArray(...parts: [BodyPartConstant[] | BodyPartConstant, number][]): [BodyPartConstant[], number] {
  let body: BodyPartConstant[] = [];
  let cost = 0;
  for (const part of parts) {
    let basePart = part[0];
    if (basePart instanceof Array) {
      let partCost = 0;
      for (const part of basePart) partCost += BODYPART_COST[part];
      cost += partCost * part[1];
      for (let i = 0; i < part[1]; i++) body.push(...basePart);
    } else {
      cost += BODYPART_COST[basePart] * part[1];
      body.concat(Array(part[1]).fill(basePart));
    }
  }
  return [body, cost];
}
function getRemainingSpawnEnergy(room: Room): number {
  return (
    // all energy in extension
    room.extension.reduce((acc, ext) => acc + ext.store.energy, 0) +
    // max energy in spawn
    room.spawn.reduce((maxE, spawn) => Math.max(maxE, spawn.store.energy), 0)
  );
}

//*****************************************************//
//                  Harvester Config
//*****************************************************//
const HARVESTER_BODY = [
  generateBodyArray([WORK, 2], [MOVE, 2]), // cost 300
  generateBodyArray([WORK, 4], [MOVE, 2]), // cost 500
  generateBodyArray([WORK, 5], [MOVE, 3]), // cost 650
  generateBodyArray([WORK, 6], [CARRY, 8], [MOVE, 7]) // cost 1350
];
function getHarvesterConfig(
  room: Room,
  hasLink: boolean,
  remainEnergy: number,
  carrierAlive: boolean
): [BodyPartConstant[], number] {
  let index: number;
  let numExt = room.extension.length;
  if (numExt >= 21 && hasLink) index = 3;
  else if (numExt >= 7) index = 2;
  else if (numExt >= 4) index = 1;
  else index = 0;
  if (!carrierAlive) while (index > 0 && remainEnergy < HARVESTER_BODY[index][1]) index--;
  return HARVESTER_BODY[index];
}
function getHarvesterNum(lv: number, numSources: number, getNumConstructionSite: () => number): number {
  if (lv == 1 && getNumConstructionSite() > 0) return 0;
  return numSources;
}

//*****************************************************//
//                  Carrier Config
//*****************************************************//
const CARRIER_BODY = [
  generateBodyArray([[CARRY, MOVE], 2]), // cost 200, Actually use
  generateBodyArray([CARRY, 4], [MOVE, 2]), // cost 300, Fallback
  generateBodyArray([CARRY, 6], [MOVE, 3]), // cost 450, Actually use
  generateBodyArray([CARRY, 8], [MOVE, 4]), // cost 600, Fallback
  generateBodyArray([CARRY, 10], [MOVE, 5]), // cost 750, Actually use
  generateBodyArray([CARRY, 12], [MOVE, 6]) // cost 900, Actually use
];
function getCarrierConfig(room: Room, remainEnergy: number): [BodyPartConstant[], number] {
  let index: number;
  let numExt = room.extension.length;
  if (numExt >= 12) index = 5;
  else if (numExt >= 9) index = 4;
  else if (numExt >= 3) index = 2;
  else index = 0;
  while (index > 1 && remainEnergy < CARRIER_BODY[index][1]) index--;
  return CARRIER_BODY[index];
}
function getCarrierNum(lv: number, getNumConstructionSite: () => number): number {
  if (lv == 1 && getNumConstructionSite() > 0) return 0;
  return 1;
}

//*****************************************************//
//               Center Carrier Config
//*****************************************************//
const CCARRIER_BODY = [
  generateBodyArray([CARRY, 2], [MOVE, 2]),      // cost 200, Actually use
  generateBodyArray([CARRY, 6], [MOVE, 3]),   // cost 450, Actually use
  generateBodyArray([CARRY, 8], [MOVE, 4]),   // cost 600, Fallback
  generateBodyArray([CARRY, 10], [MOVE, 5]),  // cost 750, Actually use
  generateBodyArray([CARRY, 12], [MOVE, 6]),  // cost 900, Fallback
  generateBodyArray([CARRY, 14], [MOVE, 7]),  // cost 1050, Fallback
  generateBodyArray([CARRY, 16], [MOVE, 8]),  // cost 1200, Actually use
  generateBodyArray([CARRY, 18], [MOVE, 9]),  // cost 1350, Fallback
  generateBodyArray([CARRY, 20], [MOVE, 10]), // cost 1500, Fallback
  generateBodyArray([CARRY, 22], [MOVE, 11]), // cost 1650, Actually use
];
function getCCarrierNonFallbackConfig(room: Room, resourcePerTurn: number): number {
  let index: number;
  let numExt = room.extension.length;
  if (numExt >= 27) index = 9;
  else if (numExt >= 18) index = 6;
  else if (numExt >= 9) index = 3;
  else if (numExt >= 3) index = 1;
  else index = 0;
  function getCarryNum(index: number): number {

  }
}
function getCCarrierConfig(room: Room): [BodyPartConstant[], number] {

}
function getCCarrierNumForSingleSource(lv: number, tickCostPerTurn: number, getNumConstructionSite: () => number): number {
  // get resource per tick
  let resourcePerTick: number;
  if (lv == 1) resourcePerTick = 4;
  else if (lv == 2) resourcePerTick = 8;
  else resourcePerTick = 10;
  let resourcePerTurn = resourcePerTick * tickCostPerTurn;
  // get ccarrier capacity
  let ccarrierCapacity: number;
  if (lv == 1) ccarrierCapacity = 100;
  else if (lv == 2) ccarrierCapacity = 300;
  else if (lv == 3) ccarrierCapacity = 500;
  else if (lv == 4) ccarrierCapacity = 800;
  else ccarrierCapacity = 1100;
  // calculate how many creeps can carry all these resources

}

//*****************************************************//
//                  Repairer Config
//*****************************************************//

//*****************************************************//
//                  Upgrader Config
//*****************************************************//

//*****************************************************//
//                Constructor Config
//*****************************************************//

//*****************************************************//
//                  Reserver Config
//*****************************************************//

//*****************************************************//
//            Source Room Harvester Config
//*****************************************************//

//*****************************************************//
//             Source Room Carrier Config
//*****************************************************//

export const Develop_mood = function (context: DevelopMoodContext) {
  const getCreepConfig = function (room: Room, creepName: string): [BodyPartConstant[], number] {};

  const getCreepNum = function (): number {};

  return { getCreepConfig, getCreepNum };
};

interface DevelopMoodContext {}
