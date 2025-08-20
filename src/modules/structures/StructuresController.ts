import { SController } from "./Controller";
import { SSpawn } from "./Spawn";
import { SContainer } from "./Container";
import { SRoad } from "./Road";
import { SExtension } from "./Extension";
import { STower } from "./Tower";
import { SRampart } from "./Rampart";
import { err } from "../Message";
import { lookStructure } from "../../utils/ToolFunction";

let container: StructureContainer | StructureStorage | null | undefined = undefined;

export const StructuresController = function (context: StructureControllerContext) {
  const handleError = function (structureType: string, fn: () => void): void {
    try {
      fn();
    } catch (e) {
      err(`[Structures Controller] [${structureType}] Caught error ${(e as Error).message}`);
    }
  };
  const run = function (): void {
    const room = context.room;
    // run controller
    if (room.controller)
      handleError(STRUCTURE_CONTROLLER, () => {
        SController.run(
          room.controller!,
          context.getLevel,
          context.updateLevel,
          context.setUpdateCreepFlag,
          context.addConstructTask,
          context.createLayout
        );
      });
    for (const spawn of room.spawn) {
      handleError(STRUCTURE_SPAWN, () => {
        SSpawn.run(spawn, context.addTransferTask, context.fetchSpawnTask, context.returnSpawnTask, context.getCreepBody);
      });
    }
    for (const container of room.container) {
      handleError(STRUCTURE_CONTAINER, () => {
        SContainer.run(
          container,
          context.addRepairTask,
          context.addEmergencyRepairTask,
          context.addCarryTask,
          context.addTransferTask,
          context.getCenter,
          getCenterContainer,
          context.getContainerMemory,
          context.setContainerMemory,
        );
      });
    }
    for (const road of room.road) {
      handleError(STRUCTURE_ROAD, () => {
        SRoad.run(road, context.addRepairTask, context.addEmergencyRepairTask);
      });
    }
    for (const extension of room.extension) {
      handleError(STRUCTURE_EXTENSION, () => {
        SExtension.run(extension, context.addTransferTask);
      });
    }
    for (const tower of room.tower) {
      handleError(STRUCTURE_TOWER, () => {
        STower.run(
          tower,
          context.addTransferTask,
          context.getAttackTarget,
          context.fetchEmergencyRepairTask,
          context.finishEmergencyRepairTask,
          context.getTowerMemory
        );
      });
    }
    for (const rampart of room.rampart) {
      handleError(STRUCTURE_RAMPART, () => {
        SRampart.run(rampart, context.addRepairTask, context.getRampartTargetHits, context.addEmergencyRepairTask);
      });
    }
  };

  const postRun = function () {
    container = undefined;
  };

  const getCenterContainer = function (): StructureContainer | StructureStorage | null {
    if (container !== undefined) return container;
    if (context.room.storage) {
      container = context.room.storage;
      return container;
    }
    let center = context.getCenter();
    let result = lookStructure(context.room, center.x, center.y, STRUCTURE_CONTAINER);
    if (result) container = result as StructureContainer;
    else container = result;
    return container;
  };

  const transferToCenterContainer = function (creep: Creep, type: ResourceConstant): ScreepsReturnCode {
    let c = getCenterContainer();
    if (!c) return ERR_INVALID_TARGET;
    if (context.room.controller!.level < 8) return creep.transfer(c, type);
    // TODO: check storage resource limit
    return creep.transfer(c, type);
  };

  //*****************************************************//
  //             Container Energy Reservation
  //*****************************************************//

  return { run, getCenterContainer, transferToCenterContainer, postRun };
};

interface StructureControllerContext {
  room: Room;
  addRepairTask: (task: RepairTask) => void;
  addCarryTask: (task: CarryTask) => void;
  getAttackTarget: () => AnyCreep | Structure | null;
  createLayout: (createFn: (x: number, y: number, type: BuildableStructureConstant) => void) => void;
  getRampartTargetHits: () => number;
  addEmergencyRepairTask: (task: RepairTask) => void;
  fetchEmergencyRepairTask: () => RepairTask | null;
  finishEmergencyRepairTask: (task: RepairTask) => void;
  getCenter: () => RoomPosition;
  getLevel: () => number;
  updateLevel: (lv: number) => void;
  setUpdateCreepFlag: () => void;
  getTowerMemory: (id: string) => TowerMemory;
  fetchSpawnTask: () => SpawnTask | null;
  returnSpawnTask: (task: SpawnTask) => void;
  addConstructTask: (task: ConstructTask) => void;
  getCreepBody: (creepName: string) => BodyPartConstant[];
  getContainerMemory: (id: Id<StructureContainer>) => ContainerMemory | undefined;
  setContainerMemory: (id: Id<StructureContainer>, memory: ContainerMemory) => void;
  addTransferTask: (task: TransferTask) => void;
}
