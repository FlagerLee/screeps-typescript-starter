declare global {
  //*****************************************************//
  //                User Structure Memories
  //*****************************************************//
  interface TowerMemory {
    rt: RepairTask | null;
  }

  interface ContainerMemory {
    role: CONTAINER_ROLE;
    position: { x: number; y: number };
    resourceType: ResourceConstant;
    data?: Object; // reserved data for different roles
  }

  interface StorageMemory {
    limit: { [key in ResourceConstant]: number };
    reserve: { [key in ResourceConstant]: number };
  }

  interface UserStructureMemories {
    towerMemories: { [id: string]: TowerMemory };
    containerMemories: { [id: string]: ContainerMemory };
  }

  //*****************************************************//
  //                Game Structure Memories
  //*****************************************************//
  interface SourceMemory {
    container: string | null;
    link: string | null;
  }

  interface GameStructureMemories {
    sourceMemories: { [id: string]: SourceMemory };
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

  interface TransferTaskQueue {
    tasks: { [id: string]: TransferTask };
  }

  interface TaskMemories {
    carryTasks: CarryTaskQueue;
    repairTasks: RepairTaskQueue;
    emergencyRepairTasks: RepairTaskQueue;
    constructionTasks: ConstructionTaskQueue;
    spawnTasks: SpawnTaskQueue;
    transferTasks: TransferTaskQueue;
  }

  //*****************************************************//
  //                        Flags
  //*****************************************************//
  interface Flags {
    creepUpdateFlag: boolean;
    creepUpdateTime: number;

    stopFlag: boolean; // stop executing this room
    memoryUpdateFlag: boolean; // if set, convert old memory to new memory

    level: number;
  }

  interface RoomMemory {
    userStructureMemories: UserStructureMemories;
    gameStructureMemories: GameStructureMemories;
    tasks: TaskMemories;
    flags: Flags;
    sourceRooms: string[];
    creeps: string[];
    center: { x: number; y: number };
    dist: { [pair: number]: { dist: number; time: number } }; // a pair of position is represented as a number. dist stores the distance between these pairs, while time stores last distance update time
  }

  interface SRMemory {
    // source room memory
    init: boolean;
    numSource: number;
    ready: boolean; // room is ready to harvest(when containers are built)
    hasInvader: boolean;
    hasDefender: boolean;
  }
}

//*****************************************************//
//                   Container Roles
//*****************************************************//
export enum CONTAINER_ROLE {
  CONTAINER_CENTER,
  CONTAINER_SOURCE,
  CONTAINER_MINERAL,
  CONTAINER_CONTROLLER,
  UNKNOWN
}
