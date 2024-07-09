import { isNull } from "lodash";

interface spawnContext {
  peekSpawnTask: () => SpawnTask | null;
  getSpawnTask: () => SpawnTask | null;
  addRepairTask: (task: RepairTask) => void;
  addExpressTask: (task: ExpressTask) => void;
  getSpawnUsableEnergy: () => number;
  getMaxSpawnUsableEnergy: () => number;

  err: (message: string) => void;
}

const MUST_SPAWN_TIME = 200;
const REPAIR_THRESHOLD = 0.8;

export function run(spawn: StructureSpawn, context: spawnContext): void {
  // execute spawn function
  if (isNull(spawn.spawning)) {
    const task = context.peekSpawnTask();
    if (!isNull(task)) {
      const currentEnergy = context.getSpawnUsableEnergy();
      const costs = task!.costs;
      const bodies = task!.bodies;
      const numConfigs = costs.length;
      if (task!.postTime > MUST_SPAWN_TIME) {
        // spawn whatever can spawn instead of wait for best creep
        for (let i = 0; i < numConfigs; i++) {
          const idx = numConfigs - i - 1;
          if (currentEnergy < task!.costs[idx]) continue;
          const err = spawn.spawnCreep(bodies[idx], task!.name, {
            memory: { role: task!.role, spawnedRoom: spawn.room.name, state: 0, storage: {}, boundPos: task!.boundPos }
          });
          if (err !== OK) {
            context.err(`Spawn task failed: ${err}`);
          } else {
            context.getSpawnTask();
          }
          break;
        }
      } else {
        const maxEnergy = context.getMaxSpawnUsableEnergy();
        let idx = -1;
        for (let i = 0; i < numConfigs; i++) {
          if (maxEnergy > task!.costs[numConfigs - i - 1]) {
            if (currentEnergy > task!.costs[numConfigs - i - 1]) idx = numConfigs - i - 1;
            break;
          }
        }
        if (idx !== -1) {
          // spawn
          const err = spawn.spawnCreep(bodies[idx], task!.name, {
            memory: { role: task!.role, spawnedRoom: spawn.room.name, state: 0, storage: {}, boundPos: task!.boundPos }
          });
          if (err !== OK) {
            context.err(`Spawn task failed: ${err}`);
          } else {
            context.getSpawnTask();
          }
        }
      }
    }
  }
  // submit repair task
  if (spawn.hits < spawn.hitsMax * REPAIR_THRESHOLD) {
    context.addRepairTask({ structure: spawn, postTime: 0 });
  }
  // submit express task
  const currentSpawnEnergy = spawn.store.energy;
  const maxSpawnEnergy = spawn.store.getCapacity(RESOURCE_ENERGY);
  if (currentSpawnEnergy < maxSpawnEnergy) {
    context.addExpressTask({
      room: spawn.room.name,
      poster: spawn.id,
      resourceType: RESOURCE_ENERGY,
      amount: maxSpawnEnergy - currentSpawnEnergy,
      postTime: 0
    });
  }
}
