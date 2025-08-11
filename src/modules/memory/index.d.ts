//*****************************************************//
//                User Structure Memories
//*****************************************************//
interface TowerMemory {
  rt: RepairTask | null;
}
interface ContainerMemory {
  role: string;
}
interface UserStructureMemories {
  towerMemories: {[id: string]: TowerMemory};
  containerMemories: {[id: string]: ContainerMemory};
}

//*****************************************************//
//                Game Structure Memories
//*****************************************************//
interface SourceMemory {
  container: string | null;
  link: string | null;
}
interface GameStructureMemories {
  sourceMemories: {[id: string]: SourceMemory};
}

//*****************************************************//
//                  Task Queue Memory
//*****************************************************//
interface CarryTaskQueue {
  taskQueue: CarryTask[];
  idSet: string[];
}
interface RepairTaskQueue {
  taskQueue: RepairTask[];
  idSet: string[];
}
interface ConstructionTaskQueue {
  taskQueue: ConstructTask[];
}
interface SpawnTaskQueue {
  taskQueue: SpawnTask[];
}
interface TaskMemories {
  carryTasks: CarryTaskQueue;
  repairTasks: RepairTaskQueue;
  emergencyRepairTasks: RepairTaskQueue;
  constructionTasks: ConstructionTaskQueue;
  spawnTasks: SpawnTaskQueue;
}

//*****************************************************//
//                        Flags
//*****************************************************//
interface Flags {
  creepUpdateFlag: boolean;
  creepUpdateTime: number;

  stopFlag: boolean;  // stop executing this room
  memoryUpdateFlag: boolean;  // if set, convert old memory to new memory

  level: number;
}

interface RoomMemory {
  userStructureMemories: UserStructureMemories;
  gameStructureMemories: GameStructureMemories;
  tasks: TaskMemories;
  flags: Flags;
  sourceRooms: string[];
  creeps: string[];
  center: RoomPosition;
}

interface SRMemory {
  // source room memory
  init: boolean;
  numSource: number;
  ready: boolean; // room is ready to harvest(when containers are built)
  hasInvader: boolean;
  hasDefender: boolean;
}
