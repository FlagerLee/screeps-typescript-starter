import { CreepType, getCreepType } from "../creeps/CreepAPI";
import { err } from "../Message";

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
      body.push(...Array(part[1]).fill(basePart));
    }
  }
  return [body, cost];
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
function getHarvesterNum(room: Room, getNumConstructionSite: () => number): number {
  if (room.controller!.level == 1 && getNumConstructionSite() > 0) return 0;
  if (room.name == "sim") return 2;
  return room.source.length;
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
function getCarrierNum(room: Room, getNumConstructionSite: () => number): number {
  if (room.controller!.level == 1 && getNumConstructionSite() > 0) return 0;
  return 1;
}

//*****************************************************//
//               Center Carrier Config
//*****************************************************//
const CCARRIER_BODY = [
  generateBodyArray([CARRY, 2], [MOVE, 2]), // cost 200, Actually use
  generateBodyArray([CARRY, 6], [MOVE, 3]), // cost 450, Actually use
  generateBodyArray([CARRY, 8], [MOVE, 4]), // cost 600, Fallback
  generateBodyArray([CARRY, 10], [MOVE, 5]), // cost 750, Actually use
  generateBodyArray([CARRY, 12], [MOVE, 6]), // cost 900, Fallback
  generateBodyArray([CARRY, 14], [MOVE, 7]), // cost 1050, Fallback
  generateBodyArray([CARRY, 16], [MOVE, 8]), // cost 1200, Actually use
  generateBodyArray([CARRY, 18], [MOVE, 9]), // cost 1350, Fallback
  generateBodyArray([CARRY, 20], [MOVE, 10]), // cost 1500, Fallback
  generateBodyArray([CARRY, 22], [MOVE, 11]) // cost 1650, Actually use
];
function getCCarrierConfig(room: Room, remainEnergy: number, carrierAlive: boolean): [BodyPartConstant[], number] {
  let index: number;
  let numExt = room.extension.length;
  if (numExt >= 27) index = 9;
  else if (numExt >= 18) index = 6;
  else if (numExt >= 9) index = 3;
  else if (numExt >= 3) index = 1;
  else index = 0;
  // check fallback
  if (!carrierAlive) while (index > 0 && remainEnergy < CCARRIER_BODY[index][1]) index--;
  return CCARRIER_BODY[index];
}
function getCCarrierNum(room: Room, getNumConstructionSite: () => number): number {
  if (room.controller!.level == 1 && getNumConstructionSite() > 0) return 0;
  // TODO: disable ccarrier after the link logic is finished
  let numSources = room.source.length;
  if (room.name == "sim") numSources = 2;
  if (room.extension.length < 20) return numSources * 2;
  return numSources;
}

//*****************************************************//
//                  Repairer Config
//*****************************************************//
const REPAIRER_BODY = [
  generateBodyArray([WORK, 1], [CARRY, 2], [MOVE, 2]),
  generateBodyArray([WORK, 4], [CARRY, 2], [MOVE, 3])
];
function getRepairerConfig(room: Room): [BodyPartConstant[], number] {
  // TODO: implement
  let index = 0;
  if (room.extension.length >= 10) index = 1;
  return REPAIRER_BODY[index];
}
function getRepairerNum(room: Room, getNumRepairTask: () => number, getNumConstructionSite: () => number): number {
  if (room.controller!.level == 1 && getNumConstructionSite() > 0) return 0;
  return getNumRepairTask() == 0 ? 0 : 1;
}

//*****************************************************//
//                  Upgrader Config
//*****************************************************//
const UPGRADER_BODY = [
  [[WORK, CARRY, MOVE], 200] as [BodyPartConstant[], number],
  generateBodyArray([WORK, 2], [CARRY, 4], [MOVE, 3]),
  generateBodyArray([WORK, 4], [CARRY, 4], [MOVE, 4])
];
function getUpgraderConfig(room: Room): [BodyPartConstant[], number] {
  // TODO: implement
  let index: number;
  if (room.controller!.level == 1) index = 0;
  else if (room.extension.length < 10) index = 1;
  else index = 2;
  return UPGRADER_BODY[index];
}
function getUpgraderNum(room: Room, getNumConstructionSite: () => number): number {
  const controller = room.controller!;
  if (getNumConstructionSite() > 0) {
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
}

//*****************************************************//
//                Constructor Config
//*****************************************************//
const CONSTRUCTION_BODY = [
  [[WORK, CARRY, MOVE], 200] as [BodyPartConstant[], number],
  [[WORK, WORK, CARRY, MOVE], 300] as [BodyPartConstant[], number],
  generateBodyArray([WORK, 2], [CARRY, 4], [MOVE, 3]),
  generateBodyArray([WORK, 4], [CARRY, 8], [MOVE, 6])
];
function getConstructorConfig(room: Room): [BodyPartConstant[], number] {
  // TODO: implement
  let index: number;
  let numExt = room.extension.length;
  if (room.controller!.level == 1) index = 0;
  else if (numExt <= 10) index = 1;
  else if (numExt < 20) index = 2;
  else index = 3;
  return CONSTRUCTION_BODY[index];
}
function getConstructorNum(room: Room, getNumConstructionSite: () => number): number {
  if (getNumConstructionSite() == 0) return 0;
  // TODO: implement
  const lv = room.controller!.level;
  if (lv == 1) return 3;
  if (lv > 4) return 1;
  return 2;
}

//*****************************************************//
//                  Reserver Config
//*****************************************************//
const RESERVER_BODY = [generateBodyArray([CLAIM, 2], [MOVE, 2])];
function getReserverConfig(): [BodyPartConstant[], number] {
  return RESERVER_BODY[0];
}
function getReserverNum(room: Room, getNumSourceRooms: () => number): number {
  if (room.extension.length < 20) return 0;
  return getNumSourceRooms();
}

//*****************************************************//
//            Source Room Harvester Config
//*****************************************************//
const SRHARVESTER_BODY = [generateBodyArray([WORK, 5], [MOVE, 3])];
function getSRHarvesterConfig(): [BodyPartConstant[], number] {
  return SRHARVESTER_BODY[0];
}
function getSRHarvesterNum(getSRReadySourceNum: () => number): number {
  return getSRReadySourceNum();
}

//*****************************************************//
//             Source Room Carrier Config
//*****************************************************//
const SRCARRIER_BODY = [generateBodyArray([WORK, 4], [CARRY, 12], [MOVE, 8])];
function getSRCarrierConfig(): [BodyPartConstant[], number] {
  return SRCARRIER_BODY[0];
}
function getSRCarrierNum(getSRReadySourceNum: () => number): number {
  return getSRReadySourceNum();
}

function error(message: string) {
  err(`[DEVELOP MOOD] ${message}`);
}

export const Develop_mood = function (context: DevelopMoodContext) {
  const getRemainEnergy = function (): number {
    const room = context.room;
    return (
      // all energy in extension
      room.extension.reduce((acc, ext) => acc + ext.store.energy, 0) +
      // max energy in spawn
      room.spawn.reduce((maxE, spawn) => Math.max(maxE, spawn.store.energy), 0)
    );
  };

  const getCreepConfig = function (creepName: string): [BodyPartConstant[], number] | null {
    const creepType = getCreepType(creepName)!;
    switch (creepType) {
      case CreepType.HARVESTER:
        // TODO: add link checker
        return getHarvesterConfig(context.room, false, getRemainEnergy(), context.carrierAlive());
      case CreepType.CCARRIER:
        return getCCarrierConfig(context.room, getRemainEnergy(), context.carrierAlive());
      case CreepType.CARRIER:
        return getCarrierConfig(context.room, getRemainEnergy());
      case CreepType.REPAIRER:
        return getRepairerConfig(context.room);
      case CreepType.UPGRADER:
        return getUpgraderConfig(context.room);
      case CreepType.CONSTRUCTOR:
        return getConstructorConfig(context.room);
      case CreepType.RESERVER:
        return getReserverConfig();
      case CreepType.SRHARVESTER:
        return getSRHarvesterConfig();
      case CreepType.SRCARRIER:
        return getSRCarrierConfig();
      default:
        error(`Unhandled creep type ${creepType} in function getCreepConfig`);
        return null;
    }
  };

  const getCreepNum = function (creepType: CreepType): number | null {
    switch (creepType) {
      case CreepType.HARVESTER:
        return getHarvesterNum(context.room, context.getNumConstructionSite);
      case CreepType.CCARRIER:
        return getCCarrierNum(context.room, context.getNumConstructionSite);
      case CreepType.CARRIER:
        return getCarrierNum(context.room, context.getNumConstructionSite);
      case CreepType.REPAIRER:
        return getRepairerNum(context.room, context.getNumRepairTask, context.getNumConstructionSite);
      case CreepType.UPGRADER:
        return getUpgraderNum(context.room, context.getNumConstructionSite);
      case CreepType.CONSTRUCTOR:
        return getConstructorNum(context.room, context.getNumConstructionSite);
      case CreepType.RESERVER:
        return getReserverNum(context.room, context.getNumSourceRooms);
      case CreepType.SRHARVESTER:
        return getSRHarvesterNum(context.getSRReadySourceNum);
      case CreepType.SRCARRIER:
        return getSRCarrierNum(context.getSRReadySourceNum);
      default:
        error(`Unhandled creep type ${creepType}`);
        return null;
    }
  };

  return { getCreepConfig, getCreepNum };
};

interface DevelopMoodContext {
  room: Room;
  getNumConstructionSite: () => number;
  getNumRepairTask: () => number;
  getNumSourceRooms: () => number;
  getSRReadySourceNum: () => number;
  carrierAlive: () => boolean;
}
