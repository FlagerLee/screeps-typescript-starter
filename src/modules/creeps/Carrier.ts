import { err, info } from "../Message";
import { lookStructure } from "../../utils/ToolFunction";

function error(message: string) {
  err(`[CARRIER] ${message}`);
}

export const Creep_carrier = {
  run(
    creep: Creep,
    fetchTransferTask: (capacity: number) => TransferTask | null,
    finishTransferTask: (task: TransferTask) => void,
    returnTransferTask: (task: TransferTask) => void,
    getEnergySources: () => { id: Id<Structure>; pos: { x: number; y: number } }[]
  ): void {
    if (creep.spawning) return;
    // if creep will die soon, return task
    let memory = creep.memory;
    if (creep.ticksToLive! < 2) {
      let task = (memory.data as Carrier_data).task;
      if (task) returnTransferTask(task);
      creep.suicide();
      return;
    }

    let state: STATE = memory.state;
    // check data
    if (!memory.data) {
      creep.memory.data = { task: null } as Carrier_data;
    }
    let data = memory.data as Carrier_data;

    if (state == STATE.IDLE) {
      let task = fetchTransferTask(creep.store.getCapacity());
      if (!task) return;
      data.task = task;
      if (creep.store.getUsedCapacity(task.resourceType) < task.reservedNum) {
        creep.memory.state = STATE.FETCH;
        state = STATE.FETCH;
      } else {
        creep.memory.state = STATE.WORK;
        state = STATE.WORK;
      }
    }
    if (state == STATE.FETCH) {
      let task = data.task!;
      let target = Game.getObjectById(task.source);
      if (!target) {
        creep.memory.state = STATE.IDLE;
        return;
      }
      function processResult(result: ScreepsReturnCode, pos: RoomPosition, functionName: string): void {
        switch (result) {
          case ERR_FULL:
          case OK:
            creep.memory.state = STATE.WORK;
            break;
          case ERR_NOT_IN_RANGE:
            creep.moveTo(pos);
            break;
          case ERR_NOT_ENOUGH_RESOURCES:
            creep.say("No resource");
            break;
          default:
            error(`Unhandled ${functionName} error code: ${result}`);
        }
      }
      if (target instanceof Resource) processResult(creep.pickup(target), target.pos, "pickup");
      else processResult(creep.withdraw(target, task.resourceType), target.pos, "withdraw");
    }
    if (state == STATE.WORK) {
      let task = data.task!;
      function transfer(structure: Structure): void {
        const result = creep.transfer(structure, task.resourceType);
        switch (result) {
          case OK:
          case ERR_FULL:
            finishCarryTask(task);
            data.task = null;
            creep.memory.state = STATE.IDLE;
            break;
          case ERR_NOT_IN_RANGE:
            creep.moveTo(structure);
            break;
          case ERR_NOT_ENOUGH_RESOURCES:
            creep.memory.state = STATE.FETCH;
            break;
          default:
            error(`Unhandled transfer error code: ${result}`);
        }
      }
      let structure = Game.getObjectById(task.target);
      if (structure) transfer(structure);
      else error(`Cannot find structure ${task.target}`);
    }
  }
};

interface Carrier_data {
  task: TransferTask | WithdrawTask | null;
}

enum STATE {
  IDLE,
  FETCH,
  WORK
}
