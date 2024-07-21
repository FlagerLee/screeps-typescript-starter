interface StructureControllerContext {
  getRoom: () => Room;
  getBoundMap: () => Map<string, Structure | RoomPosition>;

  addExpressTask: (task: ExpressTask) => void;

  peekSpawnTask: () => SpawnTask | null;
  getSpawnTask: () => SpawnTask | null;

  addRepairTask: (task: RepairTask) => void;

  log: (message: string) => void;
  err: (message: string) => void;
  warn: (message: string) => void;
}
