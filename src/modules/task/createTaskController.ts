import { PriorityQueue } from "../../utils/priorityQueue";
import { isNull, isUndefined } from "lodash";
import {
  ConstructTaskToString,
  ExpressTaskToString,
  RepairTaskToString,
  SpawnTaskToString,
  StringToConstructTask,
  StringToExpressTask,
  StringToRepairTask,
  StringToSpawnTask
} from "../../utils/utils";

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
const expressPosterSet = new Set<string>();
const repairPosterSet = new Set<string>();

const spawningCreepRole: Map<string, number> = new Map();
const spawningCreepPosition: Map<RoomPosition, number> = new Map();

export function createTaskController(room: Room) {
  const preprocess = () => {
    // init
    if (isUndefined(room.memory.expressQueue)) room.memory.expressQueue = [];
    if (isUndefined(room.memory.spawnQueue)) room.memory.spawnQueue = [];
    if (isUndefined(room.memory.constructQueue)) room.memory.constructQueue = [];
    if (isUndefined(room.memory.repairQueue)) room.memory.repairQueue = [];
    if (isUndefined(room.memory.expressPosterSet)) room.memory.expressPosterSet = [];
    if (isUndefined(room.memory.repairPosterSet)) room.memory.repairPosterSet = [];

    for (const expressStr of room.memory.expressQueue) {
      const express = StringToExpressTask(expressStr);
      express.postTime++;
      expressQueue.push(express);
    }
    for (const spawnStr of room.memory.spawnQueue) {
      const spawn = StringToSpawnTask(spawnStr);
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
    for (const constructStr of room.memory.constructQueue) {
      const construct = StringToConstructTask(constructStr);
      construct.postTime++;
      constructQueue.push(construct);
    }
    for (const repairStr of room.memory.repairQueue) {
      const repair = StringToRepairTask(repairStr);
      repair.postTime++;
      repairQueue.push(repair);
    }
    for (const item of room.memory.expressPosterSet) {
      expressPosterSet.add(item);
    }
    for (const item of room.memory.repairPosterSet) {
      repairPosterSet.add(item);
    }
  };

  const peekExpressTask = () => {
    return expressQueue.peek();
  };

  const getExpressTask = () => {
    const task = expressQueue.pop();
    if (isNull(task)) return null;
    return task;
  };

  const addExpressTask = (task: ExpressTask) => {
    if (expressPosterSet.has(task.poster)) return;
    expressPosterSet.add(task.poster);
    expressQueue.push(task);
  };

  const finishExpressTask = (task: ExpressTask) => {
    expressPosterSet.delete(task.poster);
  };

  const peekSpawnTask = () => {
    return spawnQueue.peek();
  };

  const getSpawnTask = () => {
    const task = spawnQueue.pop();
    if (isNull(task)) return null;
    return task;
  };

  const addSpawnTask = (task: SpawnTask) => {
    spawnQueue.push(task);
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
    return task;
  };

  const addConstructTask = (task: ConstructTask) => {
    constructQueue.push(task);
  };

  const getRepairTask = () => {
    const task = repairQueue.pop();
    if (isNull(task)) return null;
    return task;
  };

  const addRepairTask = (task: RepairTask) => {
    if (repairPosterSet.has(task.structure.id)) return;
    repairPosterSet.add(task.structure.id);
    repairQueue.push(task);
  };

  const finishRepairTask = (task: RepairTask) => {
    repairPosterSet.delete(task.structure.id);
  };

  const postProcess = () => {
    const memory = room.memory;

    // create construction site
    for (let i = 0; i < 10; i++) {
      if (constructQueue.empty()) break;
      const task = constructQueue.pop()!;
      console.log(task.pos);
      console.log(task.type);
      console.log(room.createConstructionSite(task.pos, task.type));
    }

    // expressQueue
    memory.expressQueue = [];
    while (!expressQueue.empty()) memory.expressQueue.push(ExpressTaskToString(expressQueue.pop()!));
    // spawnQueue
    memory.spawnQueue = [];
    while (!spawnQueue.empty()) memory.spawnQueue.push(SpawnTaskToString(spawnQueue.pop()!));
    // constructQueue
    memory.constructQueue = [];
    while (!constructQueue.empty()) memory.constructQueue.push(ConstructTaskToString(constructQueue.pop()!));
    // repairQueue
    memory.repairQueue = [];
    while (!repairQueue.empty()) memory.repairQueue.push(RepairTaskToString(repairQueue.pop()!));
    // expressPosterSet
    memory.expressPosterSet = Array.from(expressPosterSet);
    // repairPosterSet
    memory.repairPosterSet = Array.from(repairPosterSet);
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
    finishRepairTask,
    postProcess
  };
}
