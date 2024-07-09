interface Memory {
  genLayout: boolean;
  debug: boolean;
  stop: boolean;
}

interface CreepMemory {
  role: string;
  spawnedRoom: string;
  state: number;
  boundPos?: RoomPosition;
  storage: { [key: string]: string };
}

interface RoomMemory {
  // store layout
  layout: Map<StructureConstant, RoomPosition[]>[];
  boundMap: Map<Structure | Source | Mineral, Structure | RoomPosition>;
  expressQueue: Set<ExpressTask>;
  spawnQueue: Set<SpawnTask>;
  constructQueue: Set<ConstructTask>;
  repairQueue: Set<RepairTask>;
  expressPosterSet: Set<string>;
  repairPosterSet: Set<string>;
}

interface ExpressTask {
  room: string;
  poster: string;
  resourceType: ResourceConstant;
  amount: number;
  postTime: number;
}

interface SpawnTask {
  bodies: BodyPartConstant[][];
  costs: number[];
  role: string;
  priority: number;
  name: string;
  boundPos?: RoomPosition;
  postTime: number;
}

interface ConstructTask {
  pos: RoomPosition;
  type: StructureConstant;
  postTime: number;
}

interface RepairTask {
  structure: Structure;
  postTime: number;
}
