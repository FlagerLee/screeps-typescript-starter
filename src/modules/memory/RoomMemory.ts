import {err, warn} from "../Message";
import PriorityQueue from "../../utils/PriorityQueue";
import { CREEP_CHECK_DURATION } from "../Constants";

function error(message: string) {
  err(`[CONSTRUCTOR] ${message}`);
}

function repairTaskPriority(task1: RepairTask, task2: RepairTask): boolean {
  function score(task: RepairTask) {
    if (task.sn == STRUCTURE_RAMPART) return 1;
    else if (task.sn == STRUCTURE_CONTAINER) return 10;
    else if (task.sn == STRUCTURE_ROAD) return 5;
    else return 7;
  }
  return score(task1) > score(task2);
}


export const RoomMemoryController = function (context: RoomMemoryControllerContext) {
  //*****************************************************//
  //             Member Variables Definition
  //*****************************************************//

  // Task Id Sets
  let carryIdSet: Set<string> | undefined = undefined;
  let repairIdSet: Set<string> | undefined = undefined;
  let emergencyRepairIdSet: Set<string> | undefined = undefined;

  // Task Queues
  let carryQueue: PriorityQueue<CarryTask> | undefined = undefined;
  let repairQueue: PriorityQueue<RepairTask> | undefined = undefined;
  let emergencyRepairQueue: PriorityQueue<RepairTask> | undefined = undefined;
  let spawnQueue: PriorityQueue<SpawnTask> | undefined = undefined;

  // Source Room Memories

  //*****************************************************//
  //           Task Id Set Initialize Function
  //*****************************************************//
  function initCarryIdSet(memory: RoomMemory) {
    carryIdSet = new Set();
    for (const id of memory.cis) {
      carryIdSet.add(id);
    }
  }

  function initRepairIdSet(memory: RoomMemory) {
    repairIdSet = new Set();
    for (const id of memory.ris) {
      repairIdSet.add(id);
    }
  }

  function initEmergencyRepairIdSet(memory: RoomMemory) {
    emergencyRepairIdSet = new Set();
    for (const id of memory.eris) {
      emergencyRepairIdSet.add(id);
    }
  }

  //*****************************************************//
  //            Task Queue Initialize Function
  //*****************************************************//

  function initCarryQueue(memory: RoomMemory) {
    function carryTaskPriority(task1: CarryTask, task2: CarryTask): boolean {
      let structure1 = Game.getObjectById(task1.tgt as Id<Structure>);
      let structure2 = Game.getObjectById(task2.tgt as Id<Structure>);
      if (!structure1 || !structure2) return true;
      let st1 = structure1.structureType;
      let st2 = structure2.structureType;

      function ty(st: StructureConstant) {
        if (st === STRUCTURE_SPAWN) return 10;
        if (st === STRUCTURE_TOWER) return 9;
        if (st === STRUCTURE_EXTENSION) return 8;
        return 7;
      }

      if (st1 !== st2) return ty(st1) > ty(st2);
      let cx = memory.center.x,
        cy = memory.center.y;
      function dist(pos: RoomPosition): number {
        return Math.abs(cx - pos.x) + Math.abs(cy - pos.y);
      }
      return dist(structure1.pos) < dist(structure2.pos);
    }
    carryQueue = new PriorityQueue<CarryTask>(carryTaskPriority);
    for (const task of memory.caq) carryQueue.push(task);
  }

  function initRepairQueue(memory: RoomMemory) {
    repairQueue = new PriorityQueue<RepairTask>(repairTaskPriority);
    for (const task of memory.rq) repairQueue.push(task);
  }

  function initEmergencyRepairQueue(memory: RoomMemory) {
    emergencyRepairQueue = new PriorityQueue<RepairTask>(repairTaskPriority);
    for (const task of memory.erq) emergencyRepairQueue.push(task);
  }

  function initSpawnQueue(memory: RoomMemory) {
    function spawnTaskPriority(task1: SpawnTask, task2: SpawnTask): boolean {
      return task1.type < task2.type;
    }
    spawnQueue = new PriorityQueue<SpawnTask>(spawnTaskPriority);
    for (const task of memory.sq) spawnQueue.push(task);
  }

  //*****************************************************//
  //                      Post Run
  //*****************************************************//

  const postRun = function () {
    let memory = context.room.memory;
    // check creep update counter
    if (memory.creepConfigUpdate) {
      memory.creepConfigUpdate = false;
      memory.lastCreepCheck = 0;
    }
    else {
      if (memory.lastCreepCheck >= CREEP_CHECK_DURATION) {
        memory.creepConfigUpdate = true;
        memory.lastCreepCheck = 0;
      } else memory.lastCreepCheck++;
    }

    // move data back to memory
    if (carryIdSet) {
      memory.cis = [];
      for (const id of carryIdSet) {
        memory.cis.push(id);
      }
      carryIdSet = undefined;
    }
    if (repairIdSet) {
      memory.ris = [];
      for (const id of repairIdSet) {
        memory.ris.push(id);
      }
      repairIdSet = undefined;
    }
    if (emergencyRepairIdSet) {
      memory.eris = [];
      for (const id of emergencyRepairIdSet) {
        memory.eris.push(id);
      }
      emergencyRepairIdSet = undefined;
    }
    if (carryQueue) {
      memory.caq = [];
      while (!carryQueue.empty()) {
        memory.caq.push(carryQueue.poll());
      }
      carryQueue = undefined;
    }
    if (repairQueue) {
      memory.rq = [];
      while (!repairQueue.empty()) {
        memory.rq.push(repairQueue.poll());
      }
      repairQueue = undefined;
    }
    if (emergencyRepairQueue) {
      memory.erq = [];
      while (!emergencyRepairQueue.empty()) {
        memory.erq.push(emergencyRepairQueue.poll());
      }
      emergencyRepairQueue = undefined;
    }
    if (spawnQueue) {
      memory.sq = [];
      while (!spawnQueue.empty()) {
        memory.sq.push(spawnQueue.poll());
      }
      spawnQueue = undefined;
    }
  };

  //*****************************************************//
  //           Carry Task Management Function
  //*****************************************************//
  const addCarryTask = function (task: CarryTask) {
    if (!carryIdSet) initCarryIdSet(context.room.memory);
    carryIdSet = carryIdSet!;
    if (!carryIdSet.has(task.tgt)) {
      carryIdSet.add(task.tgt);
      if (!carryQueue) initCarryQueue(context.room.memory);
      carryQueue!.push(task);
    }
  };

  const finishCarryTask = function (task: CarryTask) {
    if (!carryIdSet) initCarryIdSet(context.room.memory);
    carryIdSet = carryIdSet!;
    carryIdSet.delete(task.tgt);
  };

  const fetchCarryTask = function (): CarryTask | null {
    if (!carryQueue) initCarryQueue(context.room.memory);
    carryQueue = carryQueue!;
    if (carryQueue.empty()) return null;
    return carryQueue.poll();
  };

  const returnCarryTask = function (task: CarryTask) {
    if (!carryQueue) initCarryQueue(context.room.memory);
    carryQueue = carryQueue!;
    carryQueue.push(task);
  };

  //*****************************************************//
  //           Repair Task Management Function
  //*****************************************************//

  const addRepairTask = function (task: RepairTask) {
    if (!repairIdSet) initRepairIdSet(context.room.memory);
    repairIdSet = repairIdSet!;
    if (!repairIdSet.has(task.tgt)) {
      repairIdSet.add(task.tgt);
      if (!repairQueue) initRepairQueue(context.room.memory);
      repairQueue!.push(task);
    }
  };

  const finishRepairTask = function (task: RepairTask) {
    if (!repairIdSet) initRepairIdSet(context.room.memory);
    repairIdSet = repairIdSet!;
    repairIdSet.delete(task.tgt);
  };

  const fetchRepairTask = function (): RepairTask | null {
    if (!repairQueue) initRepairQueue(context.room.memory);
    repairQueue = repairQueue!;
    if (repairQueue.empty()) return null;
    return repairQueue.poll();
  };

  const returnRepairTask = function (task: RepairTask) {
    if (!repairQueue) initRepairQueue(context.room.memory);
    repairQueue = repairQueue!;
    repairQueue.push(task);
  };

  const getRepairTaskNum = function (): number {
    return context.room.memory.rq.length;
  }

  //*****************************************************//
  //      Emergency Repair Task Management Function
  //*****************************************************//

  const addEmergencyRepairTask = function (task: RepairTask) {
    if (!emergencyRepairIdSet) initEmergencyRepairIdSet(context.room.memory);
    emergencyRepairIdSet = emergencyRepairIdSet!;
    if (!emergencyRepairIdSet.has(task.tgt)) {
      emergencyRepairIdSet.add(task.tgt);
      if (!emergencyRepairQueue) initEmergencyRepairQueue(context.room.memory);
      emergencyRepairQueue!.push(task);
    }
  };

  const finishEmergencyRepairTask = function (task: RepairTask) {
    if (!emergencyRepairIdSet) initEmergencyRepairIdSet(context.room.memory);
    emergencyRepairIdSet = emergencyRepairIdSet!;
    emergencyRepairIdSet.delete(task.tgt);
  };

  const fetchEmergencyRepairTask = function (): RepairTask | null {
    if (!emergencyRepairQueue) initEmergencyRepairQueue(context.room.memory);
    emergencyRepairQueue = emergencyRepairQueue!;
    if (emergencyRepairQueue.empty()) return null;
    return emergencyRepairQueue.poll();
  };

  const returnEmergencyRepairTask = function (task: RepairTask) {
    if (!emergencyRepairQueue) initEmergencyRepairQueue(context.room.memory);
    emergencyRepairQueue = emergencyRepairQueue!;
    emergencyRepairQueue.push(task);
  };

  //*****************************************************//
  //         Construct Task Management Function
  //*****************************************************//

  const addConstructTask = function (task: ConstructTask) {
    context.room.memory.cq.unshift(task);
  };

  const addConstructTaskList = function (tasks: ConstructTask[]) {
    context.room.memory.cq = tasks.concat(context.room.memory.cq);
  };

  const fetchConstructTask = function (): ConstructTask | null {
    let constructQueue = context.room.memory.cq;
    if (constructQueue.length == 0) {
      return null;
    }
    while (constructQueue.length > 0) {
      let task = constructQueue[constructQueue.length - 1];
      let target = task.tgt;
      if (target.startsWith("|")) {
        // convert to id
        let positionList = target.split("|");
        let siteRoom = Game.rooms[positionList[3]];
        if (!siteRoom) {
          warn(`Construction site room ${positionList[3]} invisible`);
          constructQueue.pop();
          continue;
        }
        // find construction site
        const sites = siteRoom.lookForAt(LOOK_CONSTRUCTION_SITES, parseInt(positionList[1]), parseInt(positionList[2]));
        if (sites.length == 0) {
          warn(
            `Cannot find construction site at room ${positionList[3]}, position (${positionList[1]}, ${positionList[2]})`
          );
          constructQueue.pop();
          continue;
        }
        let site = sites[0];
        task.tgt = site.id;
        return task;
      } else return task;
    }
    return null;
  };

  const finishConstructTask = function (task: ConstructTask) {
    context.room.update();
    let constructQueue = context.room.memory.cq;
    if (constructQueue.length == 0) return;
    let t = constructQueue[constructQueue.length - 1];
    if (t.tgt !== task.tgt) return;
    constructQueue.pop();
  };

  const getConstructTaskNum = function (): number {
    return context.room.memory.cq.length;
  }

  //*****************************************************//
  //           Spawn Task Management Function
  //*****************************************************//

  const addSpawnTask = function (task: SpawnTask) {
    if (!spawnQueue) initSpawnQueue(context.room.memory);
    spawnQueue = spawnQueue!;
    spawnQueue.push(task);
  };

  const fetchSpawnTask = function (): SpawnTask | null {
    if (!spawnQueue) initSpawnQueue(context.room.memory);
    spawnQueue = spawnQueue!;
    if (spawnQueue.empty()) return null;
    return spawnQueue.poll();
  };

  const returnSpawnTask = function (task: SpawnTask) {
    addSpawnTask(task);
  };

  //*****************************************************//
  //             Creep Update Flag Management
  //*****************************************************//

  const setUpdateCreepFlag = function (): void {
    context.room.memory.creepConfigUpdate = true;
  };

  const getUpdateCreepFlag = function (): boolean {
    return context.room.memory.creepConfigUpdate;
  }

  //*****************************************************//
  //                Level Flag Management
  //*****************************************************//

  const getLevel = function (): number {
    return context.room.memory.lv;
  };

  const updateLevel = function (lv: number): void {
    context.room.memory.lv = lv;
  };

  //*****************************************************//
  //                Creep Management
  //*****************************************************//

  const getCreeps = function (): string[] {
    return context.room.memory.creeps;
  };

  const addCreeps = function(creepNames: string[]) {
    let creeps = context.room.memory.creeps;
    for (let creepName of creepNames) {
      if (!creeps.includes(creepName)) creeps.push(creepName);
    }
  }

  const removeCreeps = function(creepNames: string[]) {
    let creeps = context.room.memory.creeps;
    for (let creepName of creepNames) {
      let index = creeps.indexOf(creepName);
      if (index != -1) {
        creeps.splice(index, 1);
      }
    }
  }

  //*****************************************************//
  //                    Miscellaneous
  //*****************************************************//

  const getCenter = function (): RoomPosition {
    let center = context.room.memory.center;
    return new RoomPosition(center.x, center.y, context.room.name);
  };

  const getTowerMemory = function (id: string): TowerMemory {
    let memory = context.room.memory.tm[id];
    if (memory === undefined) {
      context.room.memory.tm[id] = { rt: null };
      return context.room.memory.tm[id];
    }
    return memory;
  };

  const nameInSpawnQueue = function(name: string): boolean {
    for (const task of context.room.memory.sq)
      if (name === task.name) return true;
    return false;
  }

  const getSourceRooms = function (): string[] {
    return context.room.memory.sr;
  };

  return {
    postRun,
    addCarryTask,
    finishCarryTask,
    addRepairTask,
    finishRepairTask,
    addEmergencyRepairTask,
    finishEmergencyRepairTask,
    fetchCarryTask,
    fetchRepairTask,
    fetchEmergencyRepairTask,
    returnCarryTask,
    returnRepairTask,
    getRepairTaskNum,
    returnEmergencyRepairTask,
    addConstructTask,
    addConstructTaskList,
    fetchConstructTask,
    finishConstructTask,
    getConstructTaskNum,
    addSpawnTask,
    fetchSpawnTask,
    returnSpawnTask,
    getCenter,
    setUpdateCreepFlag,
    getUpdateCreepFlag,
    getLevel,
    updateLevel,
    getTowerMemory,
    addCreeps,
    removeCreeps,
    getCreeps,
    getSourceRooms,
    nameInSpawnQueue
  };
};

interface RoomMemoryControllerContext {
  room: Room;
}
