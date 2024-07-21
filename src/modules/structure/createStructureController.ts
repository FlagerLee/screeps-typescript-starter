import * as runContainer from "./container";
import * as runExtension from "./extension";
import * as runRampart from "./rampart";
import * as runSpawn from "./spawn";
import * as runRoad from "./road";
import * as runWall from "./wall";
import { isNull, isUndefined } from "lodash";

const multipleSet: Set<string> = new Set([
  STRUCTURE_SPAWN,
  STRUCTURE_EXTENSION,
  STRUCTURE_ROAD,
  STRUCTURE_WALL,
  STRUCTURE_RAMPART,
  STRUCTURE_KEEPER_LAIR,
  STRUCTURE_PORTAL,
  STRUCTURE_LINK,
  STRUCTURE_TOWER,
  STRUCTURE_LAB,
  STRUCTURE_CONTAINER,
  STRUCTURE_POWER_BANK
]);

const singleSet: Set<string> = new Set([
  STRUCTURE_OBSERVER,
  STRUCTURE_POWER_SPAWN,
  STRUCTURE_EXTRACTOR,
  STRUCTURE_NUKER,
  STRUCTURE_FACTORY,
  STRUCTURE_INVADER_CORE
]);

const singleStructureCache: Map<string, Id<Structure>> = new Map();
const multipleStructureCache: Map<string, Id<Structure>[]> = new Map();
const sourceCache: Id<Source>[] = [];
const depositCache: Id<Deposit>[] = [];
const mineralCache: Id<Mineral>[] = [];

function getSingle(type: string, room: Room): Structure | null {
  if (singleStructureCache.has(type)) {
    const id = singleStructureCache.get(type);
    return Game.getObjectById(id!);
  }
  return null;
}

function getMultiple(type: string, room: Room): Structure[] {
  if (multipleStructureCache.has(type)) {
    const ids = multipleStructureCache.get(type);
    const res = [] as Structure[];
    for (const id of ids!) {
      const structure = Game.getObjectById(id);
      if (!isNull(structure)) res.push(structure!);
    }
    return res;
  }
  return [];
}

export function createStructureController(context: StructureControllerContext) {
  const preprocess = () => {
    const room = context.getRoom();
    // init structures
    const data = _.groupBy(room.find(FIND_STRUCTURES), s => s.structureType);
    for (const type in data) {
      if (singleSet.has(type)) {
        singleStructureCache.set(type, data[type][0].id);
      } else if (multipleSet.has(type)) {
        multipleStructureCache.set(
          type,
          data[type].map(s => {
            return s.id;
          })
        );
      }
    }
    // init sources
    room.find(FIND_SOURCES).map(s => {
      sourceCache.push(s.id);
    });
    // init deposits
    room.find(FIND_DEPOSITS).map(s => {
      depositCache.push(s.id);
    });
    // init mineral
    room.find(FIND_MINERALS).map(s => {
      mineralCache.push(s.id);
    });
  };
  const getSpawns = (): StructureSpawn[] => {
    return getMultiple(STRUCTURE_SPAWN, context.getRoom()) as StructureSpawn[];
  };
  const getExtensions = (): StructureExtension[] => {
    return getMultiple(STRUCTURE_EXTENSION, context.getRoom()) as StructureExtension[];
  };
  const getRoads = (): StructureRoad[] => {
    return getMultiple(STRUCTURE_ROAD, context.getRoom()) as StructureRoad[];
  };
  const getWalls = (): StructureWall[] => {
    return getMultiple(STRUCTURE_WALL, context.getRoom()) as StructureWall[];
  };
  const getRamparts = (): StructureRampart[] => {
    return getMultiple(STRUCTURE_RAMPART, context.getRoom()) as StructureRampart[];
  };
  const getKeeperLairs = (): StructureKeeperLair[] => {
    return getMultiple(STRUCTURE_KEEPER_LAIR, context.getRoom()) as StructureKeeperLair[];
  };
  const getPortals = (): StructurePortal[] => {
    return getMultiple(STRUCTURE_PORTAL, context.getRoom()) as StructurePortal[];
  };
  const getLinks = (): StructureLink[] => {
    return getMultiple(STRUCTURE_LINK, context.getRoom()) as StructureLink[];
  };
  const getTowers = (): StructureTower[] => {
    return getMultiple(STRUCTURE_TOWER, context.getRoom()) as StructureTower[];
  };
  const getLabs = (): StructureLab[] => {
    return getMultiple(STRUCTURE_LAB, context.getRoom()) as StructureLab[];
  };
  const getContainers = (): StructureContainer[] => {
    return getMultiple(STRUCTURE_CONTAINER, context.getRoom()) as StructureContainer[];
  };
  const getPowerBanks = (): StructurePowerBank[] => {
    return getMultiple(STRUCTURE_POWER_BANK, context.getRoom()) as StructurePowerBank[];
  };
  const getSources = (): Source[] => {
    return _.map(sourceCache, s => {
      return Game.getObjectById(s)!;
    });
  };
  const getDeposits = (): Deposit[] => {
    return _.map(depositCache, s => {
      return Game.getObjectById(s)!;
    });
  };
  const getObserver = (): StructureObserver | null => {
    const structure = getSingle(STRUCTURE_OBSERVER, context.getRoom());
    if (isNull(structure)) return null;
    return structure! as StructureObserver;
  };
  const getPowerSpawn = (): StructurePowerSpawn | null => {
    const structure = getSingle(STRUCTURE_POWER_SPAWN, context.getRoom());
    if (isNull(structure)) return null;
    return structure! as StructurePowerSpawn;
  };
  const getExtractor = (): StructureExtractor | null => {
    const structure = getSingle(STRUCTURE_EXTRACTOR, context.getRoom());
    if (isNull(structure)) return null;
    return structure! as StructureExtractor;
  };
  const getNuker = (): StructureNuker | null => {
    const structure = getSingle(STRUCTURE_NUKER, context.getRoom());
    if (isNull(structure)) return null;
    return structure! as StructureNuker;
  };
  const getFactory = (): StructureFactory | null => {
    const structure = getSingle(STRUCTURE_FACTORY, context.getRoom());
    if (isNull(structure)) return null;
    return structure! as StructureFactory;
  };
  const getInvaderCore = (): StructureInvaderCore | null => {
    const structure = getSingle(STRUCTURE_INVADER_CORE, context.getRoom());
    if (isNull(structure)) return null;
    return structure! as StructureInvaderCore;
  };
  const getController = (): StructureController | null => {
    const controller = context.getRoom().controller;
    return controller ?? null;
  };
  const getStorage = (): StructureStorage | null => {
    const storage = context.getRoom().storage;
    return storage ?? null;
  };
  const getTerminal = (): StructureTerminal | null => {
    const terminal = context.getRoom().terminal;
    return terminal ?? null;
  };
  const getMineral = (): Mineral | null => {
    if (mineralCache.length === 0) return null;
    return Game.getObjectById(mineralCache[0])!;
  };
  const run = () => {
    const room = context.getRoom();
    // run spawn
    getSpawns().map(s => {
      runSpawn.run(s, {
        peekSpawnTask: context.peekSpawnTask,
        getSpawnTask: context.getSpawnTask,
        addRepairTask: context.addRepairTask,
        addExpressTask: context.addExpressTask,
        getSpawnUsableEnergy: () => {
          return (
            _.reduce(getSpawns(), (sum, spawn) => sum + spawn.store.energy, 0) +
            _.reduce(getExtensions(), (sum, extension) => sum + extension.store.energy, 0)
          );
        },
        getMaxSpawnUsableEnergy: () => {
          return (
            _.reduce(getSpawns(), (sum, spawn) => sum + spawn.store.getCapacity(RESOURCE_ENERGY), 0) +
            _.reduce(getExtensions(), (sum, extension) => sum + extension.store.getCapacity(RESOURCE_ENERGY), 0)
          );
        },
        err: context.err
      });
    });
    // run extension
    getExtensions().map(s => {
      runExtension.run(s, {
        addRepairTask: context.addRepairTask,
        addExpressTask: context.addExpressTask
      });
    });
    // run container
    getContainers().map(s => {
      runContainer.run(s, {
        addRepairTask: context.addRepairTask
      });
    });
    const controller = getController();
    if (!isNull(controller)) {
      const energySource = context.getBoundMap().get(controller!.id);
      if (!isUndefined(energySource)) {
        if (energySource instanceof RoomPosition) {
          context.addExpressTask({
            room: energySource.roomName,
            poster: `${energySource.x}_${energySource.y}`,
            resourceType: RESOURCE_ENERGY,
            amount: 200,
            postTime: 0
          });
        } else {
          const sourceContainer = energySource as StructureContainer;
          const currentEnergy = sourceContainer.store.energy;
          const maxEnergy = sourceContainer.store.getCapacity(RESOURCE_ENERGY);
          if (currentEnergy < maxEnergy * 0.5) {
            context.addExpressTask({
              room: sourceContainer.room.name,
              poster: sourceContainer.id,
              resourceType: RESOURCE_ENERGY,
              amount: maxEnergy - currentEnergy,
              postTime: 0
            });
          }
        }
      }
    }
    // run road
    getRoads().map(s => {
      runRoad.run(s, {
        addRepairTask: context.addRepairTask
      });
    });
    // run wall
    getWalls().map(s => {
      runWall.run(s, {
        addRepairTask: context.addRepairTask
      });
    });
    // run rampart
    getRamparts().map(s => {
      runRampart.run(s, {
        addRepairTask: context.addRepairTask
      });
    });
  };

  return {
    preprocess,
    run,
    getSpawns,
    getExtensions,
    getRoads,
    getWalls,
    getRamparts,
    getKeeperLairs,
    getPortals,
    getLinks,
    getTowers,
    getLabs,
    getContainers,
    getPowerBanks,
    getSources,
    getDeposits,
    getObserver,
    getPowerSpawn,
    getExtractor,
    getNuker,
    getFactory,
    getInvaderCore,
    getController,
    getStorage,
    getTerminal,
    getMineral
  };
}
