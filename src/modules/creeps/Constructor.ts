import { CreepAPI } from "./CreepAPI";
import { err, info, warn } from "../Message";
import { creepAtBoarder, lookStructure } from "../../utils/ToolFunction";

function error(message: string) {
  err(`[CONSTRUCTOR] ${message}`);
}

export const Creep_constructor = {
  run(
    creep: Creep,
    room: Room,
    fetchConstructTask: () => ConstructTask | null,
    finishConstructTask: (task: ConstructTask) => void,
    getCenterContainer: () => StructureContainer | StructureStorage | null,
    transferToCenterContainer: (creep: Creep, type: ResourceConstant) => ScreepsReturnCode,
    setUpdateCreepFlag: () => void
  ): void {
    if (creep.spawning) return;
    if (creep.ticksToLive! < 2) {
      creep.suicide();
    }

    let state: STATE = creep.memory.state;

    // check data
    if (!creep.memory.data) {
      if (state == STATE.IDLE) {
        // init memory data
        const config = CreepAPI.getCreepConfig(creep.name, { getCreepMemoryData: true });
        creep.memory.data = config.creepMemoryData;
      } else {
        creep.say("No data");
        error(`Constructor ${creep.name} data not found`);
        return;
      }
    }
    let data = creep.memory.data as Constructor_data;
    if (!data.stop) data.stop = 0;
    if (data.stop && data.stop > 0) {
      data.stop--;
      return;
    }

    if (state == STATE.IDLE) {
      let task = fetchConstructTask();
      if (!task) {
        creep.memory.state = STATE.RETURN;
      } else {
        data.task = task;
        if (creep.store.energy < 5) {
          creep.memory.state = STATE.FETCH;
          state = STATE.FETCH;
        } else {
          creep.memory.state = STATE.WORK;
          state = STATE.WORK;
        }
      }
    }
    if (state == STATE.FETCH) {
      if (room.controller!.level == 1) {
        function harvest(source: Source): void {
          const result = creep.harvest(source);
          switch (result) {
            case OK:
              creep.memory.no_pull = true;
              break;
            case ERR_NOT_IN_RANGE:
              creep.moveTo(source.pos);
              break;
            case ERR_NOT_ENOUGH_RESOURCES:
              if (creep.store.energy > 0) {
                creep.memory.state = STATE.WORK;
                state = STATE.WORK;
              }
              break;
            default:
              error(`Unhandled harvest error: ${result}`);
          }
          if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
            creep.memory.no_pull = false;
            creep.memory.state = STATE.WORK;
            state = STATE.WORK;
          }
        }
        // harvest energy from source
        if (data.source) harvest(Game.getObjectById(data.source as Id<Source>) as Source);
        else {
          // find nearest source
          // get construction site position
          const site = Game.getObjectById(data.task!.tgt as Id<ConstructionSite>);
          if (!site) {
            error(`Cannot find construction site ${data.task!.tgt}`);
            return;
          }
          let source: Source | null = null;
          let cost = 100000;
          for (const s of room.source) {
            const path = PathFinder.search(site.pos, { pos: s.pos, range: 1 });
            if (path.cost < cost) {
              source = s;
              cost = path.path.length;
            }
          }
          if (!source) {
            error(`No source in room ${room.name}`);
            return;
          }
          data.source = source.id;
          harvest(source);
        }
      } else {
        function withdraw(structure: Structure): void {
          // structure must have .store. use ignore to simplify code.
          // @ts-ignore
          if (structure.store.energy < 600) {
            data.stop = 5;
            return;
          }
          const result = creep.withdraw(structure, RESOURCE_ENERGY);
          switch (result) {
            case ERR_FULL:
            case OK:
              creep.memory.state = STATE.WORK;
              break;
            case ERR_NOT_IN_RANGE:
              creep.moveTo(structure.pos);
              break;
            case ERR_NOT_ENOUGH_RESOURCES:
              data.stop = 5;
              creep.say("No resource");
              break;
            default:
              error(`Unhandled withdraw error code: ${result}`);
          }
        }
        // find target
        let container = getCenterContainer();
        if (!container) {
          error(`Cannot find center container`);
          return;
        }
        withdraw(container);
      }
    } else if (state == STATE.WORK) {
      const task = data.task!;
      const site = Game.getObjectById(task.tgt as Id<ConstructionSite>);
      if (!site) {
        // construction finished
        finishConstructTask(task);
        creep.memory.state = STATE.IDLE;
        creep.memory.no_pull = false;
        data.task = null;
        data.source = null;
        return;
      }
      if (creepAtBoarder(creep.pos)) creep.moveTo(site.pos); // in case creep stuck at the boarder
      const result = creep.build(site);
      switch (result) {
        case ERR_NOT_ENOUGH_RESOURCES:
          break;
        case OK:
          if (room.controller!.level <= 4) creep.memory.no_pull = true;
          break;
        case ERR_NOT_IN_RANGE:
          creep.moveTo(site.pos);
          break;
        default:
          error(`Unhandled build error code ${result}`);
      }
      if (creep.store.energy == 0) {
        creep.memory.state = STATE.FETCH;
        creep.memory.no_pull = false;
      }
    }
    if (state == STATE.RETURN) {
      setUpdateCreepFlag();
      function transfer(structure: Structure): void {
        const result = transferToCenterContainer(creep, RESOURCE_ENERGY);
        switch (result) {
          case ERR_NOT_ENOUGH_RESOURCES:
          case OK:
            creep.suicide();
            break;
          case ERR_FULL:
            creep.drop(RESOURCE_ENERGY);
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

interface Constructor_data {
  stop: number | null;
  task: ConstructTask | null;
  source: string | null;
}

enum STATE {
  IDLE,
  FETCH,
  WORK,
  RETURN
}
