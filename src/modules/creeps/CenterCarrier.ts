// Carry energy from source container to center container
import { err, info } from "../Message";
import { CreepAPI } from "./CreepAPI";
import { lookStructure } from "../../utils/ToolFunction";

function error(message: string) {
  err(`[CENTER CARRIER] ${message}`);
}

export const Creep_center_carrier = {
  run(
    creep: Creep,
    room: Room,
    getCenterContainer: () => StructureContainer | StructureStorage | null,
    transferToCenterContainer: (creep: Creep, type: ResourceConstant) => ScreepsReturnCode
  ): void {
    if (creep.spawning) return;
    let memory = creep.memory;
    let state: STATE = memory.state;
    if (!creep.memory.data) {
      if (state == STATE.FETCH) {
        // init memory data
        const config = CreepAPI.getCreepConfig(creep.name, { getCreepMemoryData: true });
        creep.memory.data = config.creepMemoryData;
      } else {
        creep.say("No data");
        error(`Center Carrier ${creep.name} data not found`);
      }
    }
    let data = memory.data as CCarrier_data;
    if (!data.stop) data.stop = 0;
    if (data.stop > 0) {
      data.stop--;
      return;
    }

    if (state == STATE.FETCH) {
      // parse index
      const idx = parseInt(creep.name.split("_")[1]) % (room.name == "sim" ? 2 : room.source.length);
      const source = room.source[idx];
      // find container
      let structures = room.lookForAtArea(
        LOOK_STRUCTURES,
        source.pos.y - 1,
        source.pos.x - 1,
        source.pos.y + 1,
        source.pos.x + 1,
        true
      );
      let container: StructureContainer | null = null;
      for (let structure of structures) {
        if (structure.structure.structureType == STRUCTURE_CONTAINER) {
          container = structure.structure as StructureContainer;
          break;
        }
      }
      if (!container) {
        error(`Cannot find container around source at (${source.pos.x}, ${source.pos.y})`);
        return;
      }
      const result = creep.withdraw(container, RESOURCE_ENERGY);
      switch (result) {
        case ERR_FULL:
        case OK:
          creep.memory.state = STATE.WORK;
          break;
        case ERR_NOT_IN_RANGE:
          creep.moveTo(container.pos);
          break;
        case ERR_NOT_ENOUGH_RESOURCES:
          data.stop = 5;
          creep.say("No resource");
          break;
        default:
          error(`Unhandled withdraw error code: ${result}`);
      }
    }
    if (state == STATE.WORK) {
      function transfer(structure: Structure): void {
        const result = transferToCenterContainer(creep, RESOURCE_ENERGY);
        switch (result) {
          case ERR_NOT_ENOUGH_RESOURCES:
          case OK:
            creep.memory.state = STATE.FETCH;
            break;
          case ERR_FULL:
            break;
          case ERR_NOT_IN_RANGE:
            creep.moveTo(structure);
            break;
          default:
            error(`Unhandled transfer error code: ${result}`);
        }
      }
      // find target
      let container = getCenterContainer();
      if (!container) {
        error(`Cannot find center container`);
        return;
      }
      transfer(container);
    }
  }
};

interface CCarrier_data {
  stop: number;
}

enum STATE {
  FETCH,
  WORK
}
