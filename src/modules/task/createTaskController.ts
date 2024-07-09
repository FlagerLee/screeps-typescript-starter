import { PriorityQueue } from "../../utils/priorityQueue";
import { isNull, isUndefined } from "lodash";

const expressQueue = new PriorityQueue<ExpressTask>((task1: ExpressTask, task2: ExpressTask): boolean => {
  const getPriority = (task: ExpressTask): number => {
    return (task.amount / 100) * Math.exp(task.postTime / 100);
  };
  return getPriority(task1) > getPriority(task2);
});
const spawnQueue = new PriorityQueue<SpawnTask>((task1: SpawnTask, task2: SpawnTask): boolean => {
  const getPriority = (task: SpawnTask): number => {
    return task.priority * Math.exp(task.postTime / 100);
  };
  return getPriority(task1) > getPriority(task2);
});
const constructQueue = new PriorityQueue<ConstructTask>((task1: ConstructTask, task2: ConstructTask): boolean => {
  return task1.postTime > task2.postTime;
});
const repairQueue = new PriorityQueue<RepairTask>((task1: RepairTask, task2: RepairTask): boolean => {
  const getPriority = (task: RepairTask): number => {
    const structure = task.structure;
    const base: number =
      structure instanceof StructureRoad
        ? 1
        : structure instanceof StructureWall
        ? 2
        : structure instanceof StructureRampart
        ? 2
        : structure instanceof StructureObserver
        ? 2
        : structure instanceof StructureExtractor
        ? 2
        : structure instanceof StructureContainer
        ? 3
        : structure instanceof StructureLab
        ? 4
        : structure instanceof StructureLink
        ? 5
        : structure instanceof StructureFactory
        ? 6
        : structure instanceof StructureTerminal
        ? 8
        : structure instanceof StructureStorage
        ? 10
        : structure instanceof StructureTower
        ? 12
        : structure instanceof StructureSpawn
        ? 15
        : 1;
    return base * Math.exp(task.postTime / 100);
  };
  return getPriority(task1) > getPriority(task2);
});

const spawningCreepRole: Map<string, number> = new Map();
const spawningCreepPosition: Map<RoomPosition, number> = new Map();

export function createTaskController(room: Room) {
  const preprocess = () => {
    // init sets
    if (isUndefined(room.memory.expressQueue)) room.memory.expressQueue = new Set();
    if (isUndefined(room.memory.spawnQueue)) room.memory.spawnQueue = new Set();
    if (isUndefined(room.memory.constructQueue)) room.memory.constructQueue = new Set();
    if (isUndefined(room.memory.repairQueue)) room.memory.repairQueue = new Set();
    if (isUndefined(room.memory.expressPosterSet)) room.memory.expressPosterSet = new Set();
    if (isUndefined(room.memory.repairPosterSet)) room.memory.repairPosterSet = new Set();

    for (const express of room.memory.expressQueue) {
      express.postTime++;
      expressQueue.push(express);
    }
    for (const spawn of room.memory.spawnQueue) {
      spawn.postTime++;
      spawnQueue.push(spawn);
      const role = spawn.role;
      const position = spawn.boundPos;
      if (spawningCreepRole.has(role)) spawningCreepRole.set(role, spawningCreepRole.get(role)! + 1);
      else spawningCreepRole.set(role, 1);
      if (!isUndefined(position)) {
        if (!spawningCreepPosition.has(position!))
          spawningCreepPosition.set(position!, spawningCreepPosition.get(position!)! + 1);
        else spawningCreepPosition.set(position!, 1);
      }
    }
    for (const construct of room.memory.constructQueue) {
      construct.postTime++;
      constructQueue.push(construct);
    }
    for (const repair of room.memory.repairQueue) {
      repair.postTime++;
      repairQueue.push(repair);
    }
  };

  const peekExpressTask = () => {
    return expressQueue.peek();
  };

  const getExpressTask = () => {
    const task = expressQueue.pop();
    if (isNull(task)) return null;
    room.memory.expressQueue.delete(task!);
    return task;
  };

  const addExpressTask = (task: ExpressTask) => {
    if (room.memory.expressPosterSet.has(task.poster)) return;
    expressQueue.push(task);
    room.memory.expressQueue.add(task);
  };

  const finishExpressTask = (task: ExpressTask) => {
    room.memory.expressPosterSet.delete(task.poster);
  };

  const peekSpawnTask = () => {
    return spawnQueue.peek();
  };

  const getSpawnTask = () => {
    const task = spawnQueue.pop();
    if (isNull(task)) return null;
    room.memory.spawnQueue.delete(task!);
    return task;
  };

  const addSpawnTask = (task: SpawnTask) => {
    spawnQueue.push(task);
    room.memory.spawnQueue.add(task);
  };

  const getNumCreepInSpawnQueueByRole = (role: string): number => {
    return spawningCreepRole.get(role) ?? 0;
  };

  const getNumCreepInSpawnQueueByPosition = (pos: RoomPosition): number => {
    return spawningCreepPosition.get(pos) ?? 0;
  };

  const getConstructTask = () => {
    const task = constructQueue.pop();
    if (isNull(task)) return null;
    room.memory.constructQueue.delete(task!);
    return task;
  };

  const addConstructTask = (task: ConstructTask) => {
    constructQueue.push(task);
    room.memory.constructQueue.add(task);
  };

  const getRepairTask = () => {
    const task = repairQueue.pop();
    if (isNull(task)) return null;
    room.memory.repairQueue.delete(task!);
    return task;
  };

  const addRepairTask = (task: RepairTask) => {
    if (room.memory.repairPosterSet.has(task.structure.id)) return;
    room.memory.repairPosterSet.add(task.structure.id);
    repairQueue.push(task);
  };

  const finishRepairTask = (task: RepairTask) => {
    room.memory.repairPosterSet.delete(task.structure.id);
  };

  return {
    preprocess,
    peekExpressTask,
    getExpressTask,
    addExpressTask,
    finishExpressTask,
    peekSpawnTask,
    getSpawnTask,
    addSpawnTask,
    getConstructTask,
    addConstructTask,
    getRepairTask,
    addRepairTask,
    finishRepairTask
  };
}
