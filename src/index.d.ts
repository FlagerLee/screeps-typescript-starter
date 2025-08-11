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

// TASK
interface ConstructTask {
  tgt: string;
}
interface CarryTask {
  tgt: string; // target id
  rt: ResourceConstant; // resource type.
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
// TASK QUEUE && TASK SET



interface CreepMemory {
  state: number;
  no_pull: boolean;
  data?: object;
}


interface CarryTaskStruct {
  Queue: CarryTask[];
  Set: string[];
}
interface RepairTaskStruct {
  Queue: RepairTask[];
  Set: string[];
}
interface EmergencyRepairTaskStruct {
  Queue: RepairTask[];
  Set: string[];
}
interface SpawnTaskStruct {
  Queue: SpawnTask[];
}
interface ConstructTaskStruct {
  Queue: ConstructTask[];
}
interface Tasks {
  CarryTask: CarryTaskStruct;
  RepairTask: RepairTaskStruct;
  EmergencyRepairTask: EmergencyRepairTaskStruct;
  SpawnTask: SpawnTaskStruct;
  ConstructTask: ConstructTaskStruct;
}
interface CreepUpdateStruct {
  lastCreepCheck: number;
  creepConfigUpdate: boolean;
}
interface NewRoomMemory {
  // debug tag. if Debug is set to true, all the logic in this room will be stopped
  Debug: boolean;

  // tasks
  Tasks: Tasks;
  // outer source rooms
  SourceRooms: string[];
  // creep update
  UpdateCreep: CreepUpdateStruct;

}

interface SpawnConfig {
  type: string; // Creep type name
  conf: number; // Spawn config index (use index number to save memory)
}
