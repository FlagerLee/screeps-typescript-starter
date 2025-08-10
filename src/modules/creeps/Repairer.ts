import { err, info } from "../Message";

function error(message: string) {
  err(`[REPAIRER] ${message}`);
}

export const Creep_repairer = {
  run(
    creep: Creep,
    room: Room,
    fetchRepairTask: () => RepairTask | null,
    returnRepairTask: (task: RepairTask) => void,
    finishRepairTask: (task: RepairTask) => void,
    getCenterContainer: () => StructureContainer | StructureStorage | null,
  ): void {
    if (creep.spawning) return;
    let memory = creep.memory;
    if (creep.ticksToLive! < 2) {
      let task = (memory.data as Repairer_data).task;
      if (task) returnRepairTask(task);
      creep.suicide();
      return;
    }

    let state: STATE = memory.state;
    // check data
    if (!memory.data) {
      memory.data = {
        task: null,
        stop: 0
      } as Repairer_data;
    }
    let data = memory.data as Repairer_data;
    if (!data.stop) data.stop = 0;
    if (data.stop && data.stop > 0) {
      data.stop --;
      return;
    }

    if (state == STATE.IDLE) {
      let task = fetchRepairTask();
      if (!task) return;
      data.task = task;
      if (creep.store.energy == 0) {
        creep.memory.state = STATE.FETCH;
        state = STATE.FETCH;
      } else {
        creep.memory.state = STATE.WORK;
        state = STATE.WORK;
      }
    }
    if (state == STATE.FETCH) {
      function withdraw(structure: Structure): void {
        // @ts-ignore
        if (structure.store.energy < 600) {
          data.stop = 10;
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
            creep.say("No resource");
            break;
          default:
            error(`Unhandled withdraw error code: ${result}`);
        }
      }
      let container = getCenterContainer();
      if (!container) {
        error(`Cannot find center container`);
        return;
      }
      withdraw(container);
    }
    if (state == STATE.WORK) {
      let task = data.task!;
      function repair(structure: Structure): void {
        const result = creep.repair(structure);
        switch (result) {
          case OK:
            break;
          case ERR_NOT_IN_RANGE:
            creep.moveTo(structure.pos);
            break;
          case ERR_NOT_ENOUGH_RESOURCES:
            creep.memory.state = STATE.FETCH;
            break;
          default:
            error(`Unhandled repair error code: ${result}`);
        }
        if (structure.hits >= task.hits) {
          finishRepairTask(task);
          data.task = null;
          creep.memory.state = STATE.IDLE;
        }
      }
      let structure = Game.getObjectById(task.tgt as Id<Structure>);
      if (structure) repair(structure);
      else {
        error(`Cannot find structure ${task.tgt}`);
        finishRepairTask(task);
        data.task = null;
        creep.memory.state = STATE.IDLE;
      }
    }
  }
};

interface Repairer_data {
  task: RepairTask | null;
  stop: number | null;
}

enum STATE {
  IDLE,
  FETCH,
  WORK
}
