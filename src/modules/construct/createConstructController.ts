import { isNull, isUndefined } from "lodash";

export function createConstructController(context: ConstructControllerContext): { run: () => void } {
  const run = function () {
    context.log("Run construct controller run");
    const chebyshevDistance = (pos1: RoomPosition, pos2: RoomPosition) => {
      return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
    };

    const creeps = context.getCreepsByRole(CONSTRUCT_CREEP_ROLE);

    const site = context.getConstructionSite();
    for (const creep of creeps) {
      const findResource = () => {
        // find another source
        const newSource = context.getAvailableSource(RESOURCE_ENERGY);
        if (!isNull(newSource)) {
          creep.memory.storage.taskSource = JSON.stringify(newSource!);
        } else {
          context.warn(`No available source of resource energy`);
        }
      };
      if (creep.memory.state === CONSTRUCT_CREEP_STATE.STATE_INIT) {
        // creep is already generated
        if (!creep.spawning) creep.memory.state = CONSTRUCT_CREEP_STATE.STATE_IDLE;
      }
      const siteStr = JSON.stringify(site);
      const task = creep.memory.storage.task;
      if (!isUndefined(task) && task !== siteStr) {
        delete creep.memory.storage.task;
        creep.memory.state = CONSTRUCT_CREEP_STATE.STATE_IDLE;
      }
      if (creep.memory.state === CONSTRUCT_CREEP_STATE.STATE_IDLE) {
        if (!isNull(site)) {
          if (creep.store.energy > 0) {
            creep.memory.storage.task = siteStr;
            creep.memory.state = CONSTRUCT_CREEP_STATE.STATE_WORK;
          } else {
            const source = context.getAvailableSource(RESOURCE_ENERGY);
            if (!isNull(source)) {
              creep.memory.storage.task = siteStr;
              creep.memory.storage.taskSource = JSON.stringify(source);
              creep.memory.state = CONSTRUCT_CREEP_STATE.STATE_FETCH;
            }
          }
        }
      }
      if (creep.memory.state === CONSTRUCT_CREEP_STATE.STATE_FETCH) {
        if (isNull(site)) {
          creep.memory.state = CONSTRUCT_CREEP_STATE.STATE_IDLE;
          continue;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const source = JSON.parse(creep.memory.storage.taskSource);
        if (source instanceof RoomPosition) {
          const resources = source.lookFor(LOOK_RESOURCES);
          let resource: Resource | undefined;
          for (const _resource of resources) {
            if (_resource.resourceType === RESOURCE_ENERGY) {
              resource = _resource;
              break;
            }
          }
          if (!isUndefined(resource)) {
            if (chebyshevDistance(source, creep.pos) > 1) creep.moveTo(source);
            else {
              creep.pickup(resource!);
              delete creep.memory.storage.taskSource;
              creep.memory.state = CONSTRUCT_CREEP_STATE.STATE_WORK;
            }
          } else {
            findResource();
          }
        } else if (source instanceof Structure) {
          let haveResource = false;
          if (source instanceof StructureStorage) haveResource = source.store.energy > 0;
          else if (source instanceof StructureContainer) haveResource = source.store.energy > 0;
          else
            context.err(
              `Source should be Storage or Container, current source is ${source.structureType}, id = ${source.id}`
            );
          if (haveResource) {
            if (chebyshevDistance(source.pos, creep.pos) > 1) creep.moveTo(source);
            else {
              creep.withdraw(source, RESOURCE_ENERGY);
              delete creep.memory.storage.taskSource;
              creep.memory.state = CONSTRUCT_CREEP_STATE.STATE_WORK;
            }
          } else {
            findResource();
          }
        } else {
          findResource();
        }
      } else if (creep.memory.state === CONSTRUCT_CREEP_STATE.STATE_WORK) {
        if (isNull(site)) {
          creep.memory.state = CONSTRUCT_CREEP_STATE.STATE_IDLE;
          continue;
        }
        const err = creep.build(site!);
        if (err === ERR_NOT_IN_RANGE) creep.moveTo(site!);
        else if (err === ERR_NOT_ENOUGH_RESOURCES) {
          findResource();
          creep.memory.state = CONSTRUCT_CREEP_STATE.STATE_FETCH;
        } else if (err === ERR_INVALID_TARGET) {
          delete creep.memory.storage.task;
          creep.memory.state = CONSTRUCT_CREEP_STATE.STATE_IDLE;
        }
      }
    }
  };

  return { run };
}
