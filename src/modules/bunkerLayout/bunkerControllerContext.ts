interface BunkerControllerContext {
  getRoom: () => Room;
  getLayout: () => Map<StructureConstant, RoomPosition[]>[];
  getBoundMap: () => Map<string, Structure | RoomPosition>;

  addConstructTask: (task: ConstructTask) => void;

  log: (message: string) => void;
}
