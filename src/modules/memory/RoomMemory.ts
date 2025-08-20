import { err, warn } from "../Message";
import PriorityQueue from "../../utils/PriorityQueue";
import { CREEP_CHECK_DURATION } from "../Constants";
import { cloneDeep } from "lodash";
import { CONTAINER_ROLE } from "./definition";

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
  let transferIdSet: Set<string> | undefined = undefined;

  // Task Queues
  let carryQueue: PriorityQueue<CarryTask> | undefined = undefined;
  let repairQueue: PriorityQueue<RepairTask> | undefined = undefined;
  let emergencyRepairQueue: PriorityQueue<RepairTask> | undefined = undefined;
  let spawnQueue: PriorityQueue<SpawnTask> | undefined = undefined;
  let transferQueue: PriorityQueue<TransferTask> | undefined = undefined;

  // Source Room Memories

  //*****************************************************//
  //                    Initializer
  //*****************************************************//
  function initMemory(): void {
    if (context.room.memory.flags) return;
    console.log("INIT");
    let sourceMemories: { [id: string]: SourceMemory } = {};
    for (const source of context.room.source) sourceMemories[source.id] = { container: null, link: null };
    // @ts-ignore
    Memory.rooms[context.room.name] = {
      userStructureMemories: { towerMemories: {}, containerMemories: {} },
      gameStructureMemories: { sourceMemories: sourceMemories },
      tasks: {
        carryTasks: { taskQueue: [], idSet: [] },
        repairTasks: { taskQueue: [], idSet: [] },
        emergencyRepairTasks: { taskQueue: [], idSet: [] },
        constructionTasks: { taskQueue: [] },
        spawnTasks: { taskQueue: [] },
        transferTasks: { tasks: {} }
      },
      flags: {
        creepUpdateFlag: true,
        creepUpdateTime: 0,
        stopFlag: false,
        memoryUpdateFlag: false,
        level: 0
      },
      sourceRooms: [],
      creeps: [],
      center: {
        x: context.room.spawn[0].pos.x - 1,
        y: context.room.spawn[0].pos.y
      },
      dist: {}
    };
  }

  //*****************************************************//
  //          Transfer Task Initialize Function
  //*****************************************************//
  function initTransferTask(memory: RoomMemory) {
    function transferTaskPriority(task1: TransferTask, task2: TransferTask): boolean {
      if (task1.resourceNum - task1.reservedNum == 0) return true; // task2 has more priority
      if (task2.resourceNum - task2.reservedNum == 0) return false; // task1 has more priority
      return task1.priority < task2.priority;
    }
    transferQueue = new PriorityQueue<TransferTask>(transferTaskPriority);
    transferIdSet = new Set<string>();
    for (let id in memory.tasks.transferTasks.tasks) {
      transferIdSet.add(id);
      transferQueue.push(memory.tasks.transferTasks.tasks[id]);
    }
  }

  //*****************************************************//
  //           Task Id Set Initialize Function
  //*****************************************************//
  function initCarryIdSet(memory: RoomMemory) {
    carryIdSet = new Set();
    for (const id of memory.tasks.carryTasks.idSet) {
      carryIdSet.add(id);
    }
  }

  function initRepairIdSet(memory: RoomMemory) {
    repairIdSet = new Set();
    for (const id of memory.tasks.repairTasks.idSet) {
      repairIdSet.add(id);
    }
  }

  function initEmergencyRepairIdSet(memory: RoomMemory) {
    emergencyRepairIdSet = new Set();
    for (const id of memory.tasks.emergencyRepairTasks.idSet) {
      emergencyRepairIdSet.add(id);
    }
  }

  //*****************************************************//
  //            Task Queue Initialize Function
  //*****************************************************//

  function initCarryQueue(memory: RoomMemory) {
    function carryTaskPriority(task1: CarryTask, task2: CarryTask): boolean {
      let structure1 = Game.getObjectById(task1.target);
      let structure2 = Game.getObjectById(task2.target);
      if (!structure1 || !structure2) return true;
      let st1 = structure1.structureType;
      let st2 = structure2.structureType;

      function ty(st: StructureConstant) {
        if (st === STRUCTURE_SPAWN) return 10;
        if (st === STRUCTURE_EXTENSION) return 9;
        if (st === STRUCTURE_TOWER) return 8;
        if (st === STRUCTURE_STORAGE || st === STRUCTURE_CONTAINER) return 7;
        return 6;
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
    for (const task of memory.tasks.carryTasks.taskQueue) carryQueue.push(task);
  }

  function initRepairQueue(memory: RoomMemory) {
    repairQueue = new PriorityQueue<RepairTask>(repairTaskPriority);
    for (const task of memory.tasks.repairTasks.taskQueue) repairQueue.push(task);
  }

  function initEmergencyRepairQueue(memory: RoomMemory) {
    emergencyRepairQueue = new PriorityQueue<RepairTask>(repairTaskPriority);
    for (const task of memory.tasks.emergencyRepairTasks.taskQueue) emergencyRepairQueue.push(task);
  }

  function initSpawnQueue(memory: RoomMemory) {
    function spawnTaskPriority(task1: SpawnTask, task2: SpawnTask): boolean {
      return task1.type < task2.type;
    }
    spawnQueue = new PriorityQueue<SpawnTask>(spawnTaskPriority);
    for (const task of memory.tasks.spawnTasks.taskQueue) spawnQueue.push(task);
  }

  //*****************************************************//
  //                      Post Run
  //*****************************************************//

  const postRun = function () {
    let memory = context.room.memory;
    let flags = memory.flags;
    // check creep update counter
    if (flags.creepUpdateFlag) {
      flags.creepUpdateFlag = false;
      flags.creepUpdateTime = 0;
    } else {
      if (flags.creepUpdateTime >= CREEP_CHECK_DURATION) {
        flags.creepUpdateFlag = true;
      } else flags.creepUpdateTime++;
    }

    let tasks = memory.tasks;
    // move data back to memory
    if (carryIdSet) {
      tasks.carryTasks.idSet = [];
      for (const id of carryIdSet) {
        tasks.carryTasks.idSet.push(id);
      }
      carryIdSet = undefined;
    }
    if (repairIdSet) {
      tasks.repairTasks.idSet = [];
      for (const id of repairIdSet) {
        tasks.repairTasks.idSet.push(id);
      }
      repairIdSet = undefined;
    }
    if (emergencyRepairIdSet) {
      tasks.emergencyRepairTasks.idSet = [];
      for (const id of emergencyRepairIdSet) {
        tasks.emergencyRepairTasks.idSet.push(id);
      }
      emergencyRepairIdSet = undefined;
    }
    if (carryQueue) {
      tasks.carryTasks.taskQueue = [];
      while (!carryQueue.empty()) {
        tasks.carryTasks.taskQueue.push(carryQueue.poll());
      }
      carryQueue = undefined;
    }
    if (repairQueue) {
      tasks.repairTasks.taskQueue = [];
      while (!repairQueue.empty()) {
        tasks.repairTasks.taskQueue.push(repairQueue.poll());
      }
      repairQueue = undefined;
    }
    if (emergencyRepairQueue) {
      tasks.emergencyRepairTasks.taskQueue = [];
      while (!emergencyRepairQueue.empty()) {
        tasks.emergencyRepairTasks.taskQueue.push(emergencyRepairQueue.poll());
      }
      emergencyRepairQueue = undefined;
    }
    if (spawnQueue) {
      tasks.spawnTasks.taskQueue = [];
      while (!spawnQueue.empty()) {
        tasks.spawnTasks.taskQueue.push(spawnQueue.poll());
      }
      spawnQueue = undefined;
    }
  };

  //*****************************************************//
  //          Transfer Task Management Function
  //*****************************************************//
  function genTransferTaskId(task: TransferTask) {
    return `${task.target}|${task.resourceType}`;
  }
  const addTransferTask = function (task: TransferTask) {
    if (!transferIdSet) initTransferTask(context.room.memory);
    transferIdSet = transferIdSet!;
    const id = genTransferTaskId(task);
    if (!transferIdSet.has(id)) {
      context.room.memory.tasks.transferTasks.tasks[id] = task;
      transferIdSet.add(id);
      transferQueue!.push(task);
    } else {
      context.room.memory.tasks.transferTasks.tasks[id].resourceNum = task.resourceNum;
    }
  };
  const fetchTransferTask = function (capacity: number): TransferTask | null {
    if (!transferIdSet) initTransferTask(context.room.memory);
    if (transferQueue!.empty()) return null;
    let task = transferQueue!.poll();
    if (task.resourceNum - task.reservedNum <= 0) return null;
    let retTask = cloneDeep(task);
    if (task.resourceNum - task.reservedNum > capacity) retTask.reservedNum = capacity;
    else retTask.reservedNum = task.resourceNum - task.reservedNum;
    task.reservedNum += retTask.reservedNum;
    transferQueue!.push(task);
    return task;
  };
  const finishTransferTask = function (task: TransferTask) {
    let origTask = context.room.memory.tasks.transferTasks.tasks[task.target];
    origTask.resourceNum -= task.reservedNum;
    if (origTask.resourceNum <= 0) {
      delete context.room.memory.tasks.transferTasks.tasks[task.target];
      return;
    }
    origTask.reservedNum -= task.reservedNum;
  };
  const returnTransferTask = function (task: TransferTask) {
    let origTask = context.room.memory.tasks.transferTasks.tasks[task.target];
    origTask.reservedNum -= task.reservedNum;
  };

  //*****************************************************//
  //           Carry Task Management Function
  //*****************************************************//
  function genCarryId(task: CarryTask) {
    return `${task.source.substring(0, 8)}|${task.target.substring(0, 8)}|${task.resourceType}`;
  }
  const addCarryTask = function (task: CarryTask) {
    if (!carryIdSet) initCarryIdSet(context.room.memory);
    carryIdSet = carryIdSet!;
    const id = genCarryId(task);
    if (!carryIdSet.has(id)) {
      carryIdSet.add(id);
      if (!carryQueue) initCarryQueue(context.room.memory);
      carryQueue!.push(task);
    }
  };

  const finishCarryTask = function (task: CarryTask) {
    if (!carryIdSet) initCarryIdSet(context.room.memory);
    carryIdSet = carryIdSet!;
    carryIdSet.delete(genCarryId(task));
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
    return context.room.memory.tasks.repairTasks.taskQueue.length;
  };

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
    context.room.memory.tasks.constructionTasks.taskQueue.unshift(task);
  };

  const addConstructTaskList = function (tasks: ConstructTask[]) {
    let constructionTasks = context.room.memory.tasks.constructionTasks;
    constructionTasks.taskQueue = tasks.concat(constructionTasks.taskQueue);
  };

  const fetchConstructTask = function (): ConstructTask | null {
    let constructQueue = context.room.memory.tasks.constructionTasks.taskQueue;
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
    let constructQueue = context.room.memory.tasks.constructionTasks.taskQueue;
    if (constructQueue.length == 0) return;
    let t = constructQueue[constructQueue.length - 1];
    if (t.tgt !== task.tgt) return;
    constructQueue.pop();
  };

  const getConstructTaskNum = function (): number {
    return context.room.memory.tasks.constructionTasks.taskQueue.length;
  };

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
    context.room.memory.flags.creepUpdateFlag = true;
  };

  const getUpdateCreepFlag = function (): boolean {
    return context.room.memory.flags.creepUpdateFlag;
  };

  //*****************************************************//
  //                Level Flag Management
  //*****************************************************//

  const getLevel = function (): number {
    return context.room.memory.flags.level;
  };

  const updateLevel = function (lv: number): void {
    context.room.memory.flags.level = lv;
  };

  //*****************************************************//
  //                Creep Management
  //*****************************************************//

  const getCreeps = function (): string[] {
    return context.room.memory.creeps;
  };

  const addCreeps = function (creepNames: string[]) {
    let creeps = context.room.memory.creeps;
    for (let creepName of creepNames) {
      if (!creeps.includes(creepName)) creeps.push(creepName);
    }
  };

  const removeCreeps = function (creepNames: string[]) {
    let creeps = context.room.memory.creeps;
    for (let creepName of creepNames) {
      let index = creeps.indexOf(creepName);
      if (index != -1) {
        creeps.splice(index, 1);
      }
    }
  };

  //*****************************************************//
  //                Structures Management
  //*****************************************************//
  const getContainerMemory = function (id: Id<StructureContainer>): ContainerMemory | undefined {
    return context.room.memory.userStructureMemories.containerMemories[id];
  };
  const setContainerMemory = function (id: Id<StructureContainer>, memory: ContainerMemory) {
    context.room.memory.userStructureMemories.containerMemories[id] = memory;
  };

  //*****************************************************//
  //                    Miscellaneous
  //*****************************************************//
  let center: RoomPosition | undefined = undefined;
  const getCenter = function (): RoomPosition {
    if (!center)
      center = new RoomPosition(context.room.memory.center.x, context.room.memory.center.y, context.room.name);
    return center;
  };

  const getTowerMemory = function (id: string): TowerMemory {
    let towerMemories = context.room.memory.userStructureMemories.towerMemories;
    let memory = towerMemories[id];
    if (memory === undefined) {
      towerMemories[id] = { rt: null };
      return towerMemories[id];
    }
    return memory;
  };

  const nameInSpawnQueue = function (name: string): boolean {
    for (const task of context.room.memory.tasks.spawnTasks.taskQueue) if (name === task.name) return true;
    return false;
  };

  const getSourceRooms = function (): string[] {
    return context.room.memory.sourceRooms;
  };

  const getEnergySources = function (): { id: Id<Structure>; pos: { x: number; y: number } }[] {
    let sources: { id: Id<Structure>; pos: { x: number; y: number } }[] = [];
    if (context.room.storage) sources.push({
      id: context.room.storage.id,
      pos: {x: context.room.storage.pos.x, y: context.room.storage.pos.y}
    });
    const level = context.room.memory.flags.level;
    if (level < 7) {
      // TODO: when level == 6, check which source container has link
      let containerMemory = context.room.memory.userStructureMemories.containerMemories;
      for (const id in containerMemory) {
        if (containerMemory[id].role == CONTAINER_ROLE.CONTAINER_SOURCE) sources.push({
          id: id as Id<Structure>,
          pos: containerMemory[id].position
        });
      }
    }
    return sources;
  };

  return {
    postRun,
    initMemory,
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
    nameInSpawnQueue,

    getContainerMemory,
    setContainerMemory,

    // Transfer Task
    addTransferTask,
    fetchTransferTask,
    returnTransferTask,
    finishTransferTask,

    // Miscellaneous
    getEnergySources
  };
};

interface RoomMemoryControllerContext {
  room: Room;
}
