import { EXPRESS_CREEP_STATE, creepConfig } from "../creepConfig";
import { isNull, isUndefined } from "lodash";

export function createExpressController(context: ExpressControllerContext): { run: () => void } {
  const run = function () {
    const chebyshevDistance = (pos1: RoomPosition, pos2: RoomPosition) => {
      return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
    };

    const creeps = context.getCreepsByRole(creepConfig.EXPRESS_CREEP_ROLE);

    for (const creep of creeps) {
      if ((creep.ticksToLive ?? 2) <= 1) {
        // creep will die in next tick, release all targets
        const taskString = creep.memory.storage.task;
        if (!isUndefined(taskString)) {
          const task = JSON.parse(taskString) as ExpressTask;
          context.finishTask(task);
          context.addExpressTask(task);
          delete creep.memory.storage.task;
        }
        continue;
      }
      if (creep.memory.state === EXPRESS_CREEP_STATE.STATE_INIT) {
        // creep is already generated
        if (!creep.spawning) creep.memory.state = EXPRESS_CREEP_STATE.STATE_IDLE;
      }
      if (creep.memory.state === EXPRESS_CREEP_STATE.STATE_IDLE) {
        // accept task
        const task = context.peekExpressTask();
        if (isNull(task)) continue;
        if (creep.store[task!.resourceType] > 0) {
          context.getExpressTask();
          creep.memory.state = EXPRESS_CREEP_STATE.STATE_CARRY;
          creep.memory.storage.task = JSON.stringify(task!);
        } else {
          // find a place to fetch resource
          const room = new Room(task!.room);
          const source = context.getAvailableSource(task!.resourceType);
          if (!isNull(source)) {
            context.getExpressTask();
            creep.memory.state = EXPRESS_CREEP_STATE.STATE_FETCH;
            creep.memory.storage.task = JSON.stringify(task!);
            creep.memory.storage.taskSource = JSON.stringify(source);
          } else {
            context.warn(`No available source of resource ${task!.resourceType}`);
          }
        }
      }
      if (creep.memory.state === EXPRESS_CREEP_STATE.STATE_FETCH) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const source = JSON.parse(creep.memory.storage.taskSource);
        const task = JSON.parse(creep.memory.storage.task) as ExpressTask;
        const findResource = () => {
          // find another source
          const room = new Room(task.room);
          const newSource = context.getAvailableSource(task.resourceType);
          if (!isNull(newSource)) {
            creep.memory.storage.taskSource = JSON.stringify(newSource!);
          } else {
            context.warn(`No available source of resource ${task.resourceType}`);
          }
        };
        if (source instanceof RoomPosition) {
          const resources = source.lookFor(LOOK_RESOURCES);
          let resource: Resource | undefined;
          for (const _resource of resources) {
            if (_resource.resourceType === task.resourceType) {
              resource = _resource;
              break;
            }
          }
          if (!isUndefined(resource)) {
            if (chebyshevDistance(source, creep.pos) > 1) creep.moveTo(source);
            else {
              creep.pickup(resource!);
              delete creep.memory.storage.taskSource;
              creep.memory.state = EXPRESS_CREEP_STATE.STATE_CARRY;
            }
          } else {
            findResource();
          }
        } else if (source instanceof Structure) {
          let haveResource = false;
          if (source instanceof StructureStorage) haveResource = source.store[task.resourceType] > 0;
          else if (source instanceof StructureContainer) haveResource = source.store[task.resourceType] > 0;
          else
            context.err(
              `Source should be Storage or Container, current source is ${source.structureType}, id = ${source.id}`
            );
          if (haveResource) {
            if (chebyshevDistance(source.pos, creep.pos) > 1) creep.moveTo(source);
            else {
              creep.withdraw(source, task.resourceType);
              delete creep.memory.storage.taskSource;
              creep.memory.state = EXPRESS_CREEP_STATE.STATE_CARRY;
            }
          } else {
            findResource();
          }
        } else {
          context.err(`Unknown task source: ${creep.memory.storage.taskSource}`);
        }
      } else if (creep.memory.state === EXPRESS_CREEP_STATE.STATE_CARRY) {
        const task = JSON.parse(creep.memory.storage.task) as ExpressTask;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const poster = JSON.parse(task.poster);
        if (poster instanceof RoomPosition) {
          if (chebyshevDistance(poster, creep.pos) > 0) creep.moveTo(poster);
          else {
            creep.drop(task.resourceType);
            context.finishTask(task);
            delete creep.memory.storage.task;
            creep.memory.state = EXPRESS_CREEP_STATE.STATE_IDLE;
          }
        } else if (poster instanceof Structure) {
          if (chebyshevDistance(poster.pos, creep.pos) > 0) creep.moveTo(poster);
          else {
            creep.transfer(poster, task.resourceType);
            context.finishTask(task);
            delete creep.memory.storage.task;
            creep.memory.state = EXPRESS_CREEP_STATE.STATE_IDLE;
          }
        } else {
          context.err(`Unknown task source: ${creep.memory.storage.taskSource}`);
        }
      }
    }
  };

  return { run };
}
