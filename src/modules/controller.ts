import { createStructureController } from "./structure/createStructureController";
import { createTaskController } from "./task/createTaskController";
import { createBunkerController } from "./bunkerLayout/createBunkerController";
import { createUpgradeController } from "./upgrade/createUpgradeController";
import { createConstructController } from "./construct/createConstructController";
import { createExpressController } from "./express/createExpressController";
import { createHarvestController } from "./harvest/createHarvestController";
import { createCreepController } from "./creep/createCreepController";
import { isNull, isUndefined } from "lodash";

interface Context {
  log: (message: string) => void;
  err: (message: string) => void;
  warn: (message: string) => void;
}

export function createController(context: Context) {
  const run = () => {
    const rooms = Game.rooms;
    const creepController = createCreepController({
      log: context.log,
      err: context.err,
      warn: context.warn
    });
    creepController.preprocess();
    for (const [name, room] of Object.entries(rooms)) {
      // eslint-disable-next-line no-underscore-dangle
      const _getRoom = () => {
        return room;
      };
      const taskController = createTaskController(room);
      const layoutController = createBunkerController({
        getRoom: _getRoom,
        addConstructTask: taskController.addConstructTask
      });
      const structureController = createStructureController({
        getRoom: _getRoom,
        addExpressTask: taskController.addExpressTask,
        peekSpawnTask: taskController.peekSpawnTask,
        getSpawnTask: taskController.getSpawnTask,
        addRepairTask: taskController.addRepairTask,
        log: context.log,
        err: context.err,
        warn: context.warn
      });
      const upgradeController = createUpgradeController({
        getController: (): StructureController => {
          return room.controller!;
        },
        getPositionBoundCreeps: creepController.getCreepsByPosition,
        getControllerEnergySourcePos: (controller: StructureController): RoomPosition => {
          const _room = controller.room;
          const res = _room.memory.boundMap.get(controller);
          if (isNull(res)) {
            context.err(
              `Source in room ${_room.name}, position (${controller.pos.x}, ${controller.pos.y}) has no bound container!`
            );
            return controller.pos;
          }
          if (res instanceof RoomPosition) return res;
          else return res!.pos;
        },
        err: context.err,
        warn: context.warn
      });
      // eslint-disable-next-line no-underscore-dangle
      const _getAvailableSource = (resourceType: ResourceConstant, _room?: Room): Structure | RoomPosition | null => {
        const storage = room.storage;
        if (storage) {
          if (storage.store[resourceType] !== 0) return storage;
        }
        const containers = structureController.getContainers();
        for (const container of containers) {
          if (container.store[resourceType] !== 0) return container;
        }
        const positions = layoutController.getContainerPos();
        for (const position of positions) {
          const resources = room.lookForAt(LOOK_RESOURCES, position);
          for (const resource of resources) {
            if (resource.resourceType === resourceType) return position;
          }
        }
        return null;
      };
      const constructController = createConstructController({
        getConstructionSite: (): ConstructionSite | null => {
          const sites = room.find(FIND_CONSTRUCTION_SITES);
          if (sites.length === 0) return null;
          return sites[0];
        },
        getAvailableSource: _getAvailableSource,
        getCreepsByRole: (role: string): Creep[] => {
          return creepController.getCreepsByRole(room, role);
        },
        getNumCreepsByRole: (role: string): number => {
          return creepController.getCreepNumByRole(room, role);
        },
        err: context.err,
        warn: context.warn
      });
      const expressController = createExpressController({
        peekExpressTask: taskController.peekExpressTask,
        getExpressTask: taskController.getExpressTask,
        addExpressTask: taskController.addExpressTask,
        finishTask: taskController.finishExpressTask,
        getAvailableSource: _getAvailableSource,
        getCreepsByRole: (role: string): Creep[] => {
          return creepController.getCreepsByRole(room, role);
        },
        getNumCreepsByRole: (role: string): number => {
          return creepController.getCreepNumByRole(room, role);
        },
        err: context.err,
        warn: context.warn
      });
      const harvestController = createHarvestController({
        getSources: structureController.getSources,
        getSourceBoundRoom: (source: Source): Room => {
          // TODO: add support for non-control room
          return source.room;
        },
        getSourceBoundContainerPos: (source: Source): RoomPosition => {
          // eslint-disable-next-line no-underscore-dangle
          const _room = source.room;
          const res = _room.memory.boundMap.get(source);
          if (isNull(res)) {
            context.err(
              `Source in room ${_room.name}, position (${source.pos.x}, ${source.pos.y}) has no bound container!`
            );
            return source.pos;
          }
          if (res instanceof RoomPosition) return res;
          else return res!.pos;
        },
        getPositionBoundCreeps: creepController.getCreepsByPosition,
        eliminateCreep: (creep: Creep): void => {
          creep.suicide();
        }
      });

      // start running
      if (isUndefined(Memory.genLayout)) {
        Memory.genLayout = true;
      }
      if (Memory.genLayout) {
        layoutController.createLayout();
        layoutController.createConstructionSiteByLevel(1);
        Memory.genLayout = false;
      }

      // preprocess
      taskController.preprocess();
      structureController.preprocess();

      // run
      structureController.run();
      upgradeController.run();
      constructController.run();
      expressController.run();
      harvestController.run();
    }
  };

  return { run };
}
