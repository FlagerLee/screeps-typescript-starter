interface RoomMemory {
  Debug: boolean;
  // structure memory
  tm: { [id: string]: TowerMemory };

  caq: CarryTask[]; // carry task queue
  cis: string[]; // carry task id set
  rq: RepairTask[]; // repair task queue
  erq: RepairTask[]; // emergency repair task
  ris: string[]; // repair task id set
  eris: string[]; // emergency repair task id set
  cq: ConstructTask[]; // construction queue
  sq: SpawnTask[]; // spawn queue
  fb: boolean; // creep config fallback
  fbc: number; // fallback cost
  sr: string[]; // source rooms(外矿房)
  creeps: string[];
  center: { x: number; y: number };
  lv: number; // controller level(used to check controller upgrade)
  lastCreepCheck: number; // ticks since last creep check
  creepConfigUpdate: boolean; // creep config update flag
}

interface SRMemory {
  // source room memory
  init: boolean;
  numSource: number;
  ready: boolean; // room is ready to harvest(when containers are built)
  hasInvader: boolean;
  hasDefender: boolean;
}

interface TowerMemory {
  rt: RepairTask | null;
}

interface SourceMemory {
  container: string | null;
  link: string | null;
}
