import { CreepAPI } from "../creeps/CreepAPI";
import { err } from "../Message";

export const SSpawn = {
  run(
    spawn: StructureSpawn,
    addCarryTask: (task: CarryTask) => void,
    fetchSpawnTask: () => SpawnTask | null,
    returnSpawnTask: (task: SpawnTask) => void
  ) {
    // check energy
    if (spawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
      // create carry task
      addCarryTask({
        tgt: spawn.id,
        rt: RESOURCE_ENERGY
      });

    if (spawn.spawning) return;
    // check spawning
    let otherSpawnTask: SpawnTask[] = [];
    let task = fetchSpawnTask();
    while (task && task.spawn && task.spawn !== spawn.id) {
      otherSpawnTask.push(task);
      task = fetchSpawnTask();
    }
    if (!task) return;
    for (const ot of otherSpawnTask) returnSpawnTask(ot);
    // get current task spawn config
    let config = CreepAPI.getCreepConfig(task.name, { getSpawnInfo: true });
    let result = spawn.spawnCreep(config.body!, task.name, { dryRun: true });
    switch (result) {
      case ERR_NAME_EXISTS:
      case ERR_NOT_ENOUGH_RESOURCES:
        break;
      case OK:
        spawn.spawnCreep(config.body!, task.name, { memory: { state: 0, no_pull: false } });
        break;
      default:
        err(`[SPAWN] Unhandled spawn error code ${result}`);
    }
  }
};
