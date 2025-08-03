import { err } from "../Message";
import { creepAtBoarder, harvestMsg, lookRangeStructure } from "../../utils/ToolFunction";

function error(message: string) {
  err(`[SR HARVESTER] ${message}`);
}

function getSourceByIdx(sr: string[], idx: number): Source | null {
  for (let roomName of sr) {
    let sourceNum = (Memory.rooms[roomName] as unknown as SRMemory).numSource;
    if (idx < sourceNum) {
      let r = Game.rooms[roomName];
      if (!r) {
        error(`Room ${roomName} invisible`);
        return null;
      }
      return r.source[idx];
    } else idx -= sourceNum;
  }
  return null;
}

export const Creep_sr_harvester = {
  run(creep: Creep, room: Room, getSourceRooms: () => string[]) {
    if (creep.spawning) return;
    let memory = creep.memory;
    let state: STATE = memory.state;

    // check data
    if (!memory.data) {
      let l = creep.name.split("_");
      let source = getSourceByIdx(getSourceRooms(), parseInt(l[1]));
      if (!source) {
        error(`Cannot find source, idx = ${l[1]}`);
        return;
      }
      let result = lookRangeStructure(source.room, source.pos.x, source.pos.y, 1, STRUCTURE_CONTAINER);
      if (!result) {
        error(
          `Cannot find container around source, room = ${source.room.name}, pos = (${source.pos.x}, ${source.pos.y})`
        );
        return;
      }
      memory.data = {
        sid: source.id,
        cid: (result as StructureContainer).id
      };
    }
    let data = memory.data as SRHarvester_data;

    // check if room has invader. if so, flee
    let source = Game.getObjectById(data.sid as Id<Source>);
    if (!source) {
      creep.say("No source");
      error(`Cannot find source`);
      return;
    }
    let outerRoom = source.room;
    let outerRoomMemory = outerRoom.memory as unknown as SRMemory;
    if (outerRoomMemory.hasInvader) memory.state = STATE.FLEE;
    else if (memory.state == STATE.FLEE) memory.state = STATE.MOVE;

    if (state == STATE.MOVE) {
      let container = Game.getObjectById(data.cid as Id<StructureContainer>);
      if (!container) {
        error(`SR Harvester ${creep.name} cannot find source container`);
        return;
      }
      if (!creep.pos.isEqualTo(container.pos)) creep.moveTo(container.pos);
      else memory.state = STATE.WORK;
    }
    if (state == STATE.WORK) {
      let container = Game.getObjectById(data.cid as Id<StructureContainer>);
      if (!container) {
        creep.say("No container");
        error("Cannot find container");
        return;
      }
      if (container.store.getFreeCapacity(RESOURCE_ENERGY) == 0) return;
      let source = Game.getObjectById(data.sid as Id<Source>);
      if (!source) {
        creep.say("No source");
        error(`Cannot find source`);
        return;
      }
      let result = creep.harvest(source);
      switch (result) {
        case OK:
          break;
        case ERR_NOT_IN_RANGE:
          memory.state = STATE.MOVE;
          break;
        default:
          creep.say("Cannot harvest");
          error(harvestMsg(result));
      }
    }
    if (state == STATE.FLEE) {
      // go back to main room
      if (creep.room.name !== room.name) {
        creep.moveTo(room.controller!);
      } else {
        // in case creep stuck at the boarder
        if (creepAtBoarder(creep.pos)) creep.moveTo(room.controller!);
      }
    }
  }
};

interface SRHarvester_data {
  sid: string;
  cid: string;
}

enum STATE {
  MOVE,
  WORK,
  FLEE
}
