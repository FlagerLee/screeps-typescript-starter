import { err } from "../Message";
import { TRANSFER_PRIORITY_SPAWN } from "../Constants";

export const SSpawn = {
  run(
    spawn: StructureSpawn,
    addTransferTask: (task: TransferTask) => void,
    fetchSpawnTask: () => SpawnTask | null,
    returnSpawnTask: (task: SpawnTask) => void,
    getCreepBody: (creepName: string) => BodyPartConstant[]
  ) {
    // check energy
    if (spawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
      addTransferTask({
        position: {x: spawn.pos.x, y: spawn.pos.y},
        target: spawn.id,
        resourceType: RESOURCE_ENERGY,
        priority: TRANSFER_PRIORITY_SPAWN,
        resourceNum: spawn.store.getFreeCapacity(RESOURCE_ENERGY),
        reservedNum: 0
      })

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
