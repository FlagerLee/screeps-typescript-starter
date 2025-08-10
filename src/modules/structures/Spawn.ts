import { err } from "../Message";

export const SSpawn = {
  run(
    spawn: StructureSpawn,
    addCarryTask: (task: CarryTask) => void,
    fetchSpawnTask: () => SpawnTask | null,
    returnSpawnTask: (task: SpawnTask) => void,
    getCreepBody: (creepName: string) => BodyPartConstant[]
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
    for (const ost of otherSpawnTask) returnSpawnTask(ost);
    if (!task) return;
    // get current task spawn config
    const body = getCreepBody(task.name);
    let result = spawn.spawnCreep(body, task.name, { dryRun: true });
    switch (result) {
      case ERR_NAME_EXISTS:
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        returnSpawnTask(task);
        break;
      case OK:
        spawn.spawnCreep(body, task.name, { memory: { state: 0, no_pull: false } });
        break;
      default:
        returnSpawnTask(task);
        err(`[SPAWN] Unhandled spawn error code ${result}`);
    }
  }
};
