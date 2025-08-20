interface Room {
  // multiple structures
  spawn: StructureSpawn[];
  extension: StructureExtension[];
  road: StructureRoad[];
  wall: StructureWall[];
  rampart: StructureRampart[];
  keeperLair: StructureKeeperLair[];
  portal: StructurePortal[];
  link: StructureLink[];
  tower: StructureTower[];
  lab: StructureLab[];
  container: StructureContainer[];
  powerBank: StructurePowerBank[];

  // single structures
  observer?: StructureObserver;
  powerSpawn?: StructureSpawn;
  extractor?: StructureExtractor;
  nuker?: StructureNuker;
  factory?: StructureFactory;
  invaderCore?: StructureInvaderCore;
  mineral?: Mineral;

  // additional
  source: Source[];
  deposit: Deposit[];

  mass_stores: Set<string>;
  my: boolean;
  level: number;

  // function
  update(): void;
}
interface Room {
  resetQueue: () => void;
}

//*****************************************************//
//                        Tasks
//*****************************************************//
interface ConstructTask {
  tgt: string;
}
interface CarryTask {
  source: Id<Structure> | Id<Tombstone> | Id<Resource>;
  target: Id<Structure>; // target id
  resourceType: ResourceConstant; // resource type.
  mustFetch: boolean;
}
interface RepairTask {
  tgt: string; // target id.
  hits: number; // hits to be repaired
  sn: string; // structure name
}
interface SpawnTask {
  name: string; // creep name
  type: number; // creep type
  spawn: string | null; // select specific spawn
}
interface TransferTask {
  position: {x: number, y: number};
  target: Id<Structure>;
  resourceType: ResourceConstant;
  priority: number;
  resourceNum: number;
  reservedNum: number;
}
interface WithdrawTask {
  position: {x: number, y: number};
  target: Id<Structure>;
  resourceType: ResourceConstant;
}
interface PickupTask {

}
// TASK QUEUE && TASK SET



interface CreepMemory {
  state: number;
  no_pull: boolean;
  data?: object;
}

interface SpawnConfig {
  type: string; // Creep type name
  conf: number; // Spawn config index (use index number to save memory)
}
