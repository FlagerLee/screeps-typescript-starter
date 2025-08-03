import { CreepAPI } from "./CreepAPI";
import { err, info } from "../Message";
import { lookStructure } from "../../utils/ToolFunction";

// TODO: 1. calculate px and py; 2. fill state IDLE by get memory data from creepapi

function error(message: string) {
  err(`[HARVESTER] ${message}`);
}

export const Creep_harvester = {
  run(creep: Creep, room: Room): void {
    if (creep.spawning) return;
    let memory = creep.memory;
    let state: STATE = memory.state;

    // check data
    if (!creep.memory.data) {
      if (state == STATE.MOVE) {
        // init memory data
        const config = CreepAPI.getCreepConfig(creep.name, { getCreepMemoryData: true });
        creep.memory.data = config.creepMemoryData;
      } else {
        creep.say("No data");
        error(`Harvester ${creep.name} data not found`);
      }
    }
    let data = creep.memory.data as Harvester_data;

    if (state == STATE.MOVE) {
      // find container
      if (data.cid == "") {
        // get container
        let source = Game.getObjectById(data.sid as Id<Source>);
        if (!source) {
          error(`Harvester ${creep.name} cannot find source`);
          return;
        }
        source = source!;
        let container = lookStructure(room, source.pos.x, source.pos.y, STRUCTURE_CONTAINER);
        if (container) data.cid = container.id;
        else {
          error(`Cannot find source container around (${source.pos.x}, ${source.pos.y})`);
        }
      }
      let container = Game.getObjectById(data.cid as Id<StructureContainer>);
      if (container) {
        if (!creep.pos.isEqualTo(container.pos)) {
          let result = creep.moveTo(container.pos);
        } else {
          creep.memory.state = STATE.WORK;
          state = STATE.WORK;
        }
      } else {
        error(`Harvester ${creep.name} cannot find source container`);
        return;
      }
    }
    if (state == STATE.WORK) {
      let container = Game.getObjectById(data.cid as Id<StructureContainer>);
      if (!container) {
        error(`Harvester ${creep.name} cannot find source container`);
        return;
      }
      if (!creep.pos.isEqualTo(container.pos)) {
        creep.memory.state = STATE.MOVE;
        return;
      }
      if (container.store.getFreeCapacity(RESOURCE_ENERGY) == 0) return;
      let source = Game.getObjectById(data.sid as Id<Source>);
      if (source) {
        const result = creep.harvest(source);
        switch (result) {
          case OK:
            break;
          case ERR_NOT_IN_RANGE:
            creep.memory.state = STATE.MOVE;
            break;
          default:
            creep.say("Cannot harvest");
            error(`Harvester ${creep.name} cannot harvest, error code = ${result}`);
        }
      } else {
        creep.say("No source");
        error(`Cannot find source`);
      }
    }
  }
};

interface Harvester_data {
  sid: string; // source id
  cid: string; // container id (if needed)
}

enum STATE {
  MOVE, // move to an energy source
  WORK // harvest
}
