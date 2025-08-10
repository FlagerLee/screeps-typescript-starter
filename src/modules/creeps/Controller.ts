import { Creep_harvester } from "./Harvester";
import { checkCreepMemory, checkCreepNum } from "./CreepChecker";
import { Creep_upgrader } from "./Upgrader";
import { CreepType, getCreepType } from "./CreepAPI";
import { Creep_constructor } from "./Constructor";
import { Creep_carrier } from "./Carrier";
import { Creep_repairer } from "./Repairer";
import { Creep_center_carrier } from "./CenterCarrier";
import { err } from "../Message";
import { Creep_reserver } from "./Reserver";
import { Creep_sr_harvester } from "./SRHarvester";
import { Creep_sr_carrier } from "./SRCarrier";

function error(message: string) {
  err(`[CREEP CONTROLLER] ${message}`);
}

export const CreepController = function (context: CreepControllerContext) {
  const prerun = function (): void {
    checkCreepMemory(context.room, context.spawnFunc);
  };

  const run = function (): void {
    const room = context.room;

    // get maintenancer queue
    for (let [name, creep] of Object.entries(Game.creeps)) {
      // use name to identify the creep's type
      const creepType = getCreepType(name);
      switch (creepType) {
        case CreepType.HARVESTER:
          Creep_harvester.run(creep, room);
          break;
        case CreepType.CCARRIER:
          Creep_center_carrier.run(creep, room, context.getCenterContainer, context.transferToCenterContainer);
          break;
        case CreepType.CARRIER:
          Creep_carrier.run(
            creep,
            room,
            context.fetchCarryTask,
            context.returnCarryTask,
            context.finishCarryTask,
            context.getCenterContainer
          );
          break;
        case CreepType.REPAIRER:
          Creep_repairer.run(
            creep,
            room,
            context.fetchRepairTask,
            context.returnRepairTask,
            context.finishRepairTask,
            context.getCenterContainer
          );
          break;
        case CreepType.UPGRADER:
          Creep_upgrader.run(creep, room, context.getCenterContainer);
          break;
        case CreepType.CONSTRUCTOR:
          Creep_constructor.run(
            creep,
            room,
            context.fetchConstructTask,
            context.finishConstructTask,
            context.getCenterContainer,
            context.transferToCenterContainer,
            context.setUpdateCreepFlag
          );
          break;
        case CreepType.RESERVER:
          Creep_reserver.run(creep, room, context.getSourceRooms);
          break;
        case CreepType.SRHARVESTER:
          Creep_sr_harvester.run(creep, room, context.getSourceRooms, context.hasInvader);
          break;
        case CreepType.SRCARRIER:
          Creep_sr_carrier.run(creep, room, context.getSourceRooms, context.hasInvader);
          break;
        default:
          error(`Unhandled creep type: ${name}`);
      }
    }

    // check creep num
    if (context.getUpdateCreepFlag())
      checkCreepNum(
        room,
        context.getCreeps,
        context.addCreeps,
        context.removeCreeps,
        context.getCreepNum,
        context.nameInSpawnQueue
      );
  };

  return { prerun, run };
};

interface CreepControllerContext {
  spawnFunc(name: string): void;
  room: Room;
  fetchCarryTask(): CarryTask | null;
  fetchRepairTask(): RepairTask | null;
  fetchConstructTask(): ConstructTask | null;
  returnCarryTask(task: CarryTask): void;
  returnRepairTask(task: RepairTask): void;
  finishCarryTask(task: CarryTask): void;
  finishRepairTask(task: RepairTask): void;
  finishConstructTask(task: ConstructTask): void;
  getCenterContainer(): StructureContainer | StructureStorage | null;
  transferToCenterContainer(creep: Creep, type: ResourceConstant): ScreepsReturnCode;
  getSourceRooms(): string[];
  setUpdateCreepFlag(): void;
  getUpdateCreepFlag(): boolean;
  getCreeps(): string[];
  addCreeps(creepNames: string[]): void;
  removeCreeps(creepNames: string[]): void;
  getCreepNum(creepType: CreepType): number;
  nameInSpawnQueue(creepName: string): boolean;
  hasInvader(roomName: string): boolean;
}
