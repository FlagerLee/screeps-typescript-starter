import { err, warn } from "../Message";
import { TRANSFER_PRIORITY_TOWER } from "../Constants";

function error(message: string) {
  err(`[TOWER] ${message}`);
}

export const STower = {
  run(
    tower: StructureTower,
    addTransferTask: (task: TransferTask) => void,
    getAttackTarget: () => AnyCreep | Structure | null,
    fetchEmergencyRepairTask: () => RepairTask | null,
    finishEmergencyRepairTask: (task: RepairTask) => void,
    getTowerMemory: (id: string) => TowerMemory
  ) {
    // carry task
    if (tower.store.getFreeCapacity(RESOURCE_ENERGY) >= 100)
      addTransferTask({
        position: { x: tower.pos.x, y: tower.pos.y },
        target: tower.id,
        resourceType: RESOURCE_ENERGY,
        priority: TRANSFER_PRIORITY_TOWER,
        resourceNum: tower.store.getFreeCapacity(RESOURCE_ENERGY),
        reservedNum: 0
      });
    // init memory
    let memory = getTowerMemory(tower.id);
    // repair
    function repair(task: RepairTask): number {
      let structure = Game.getObjectById(task.tgt as Id<Structure>);
      if (structure) {
        if (structure.hits >= task.hits) return 1;
        let result = tower.repair(structure);
        if (result == OK || result == ERR_NOT_ENOUGH_RESOURCES) return 0;
        else {
          error(`Repair error code ${result}`);
          return -1;
        }
      } else {
        error(`Cannot find repair structure ${task.tgt}`);
        return -1;
      }
    }
    // try to repair emergency structures
    if (memory) {
      if (!memory.rt) memory.rt = fetchEmergencyRepairTask();
      if (memory.rt) {
        let result = repair(memory.rt);
        if (result != 0) {
          // fetch new task
          finishEmergencyRepairTask(memory.rt);
          memory.rt = fetchEmergencyRepairTask();
        }
        return;
      }
    } else {
      warn(`[TOWER] Tower ${tower.id} has no memory`);
    }
    // attack target
    let target = getAttackTarget();
    if (target) tower.attack(target);
    // check if any creep needs healing
    for (let creep of tower.room.find(FIND_MY_CREEPS)) {
      if (creep.hits < creep.hitsMax) {
        tower.heal(creep);
        break;
      }
    }
  }
};
