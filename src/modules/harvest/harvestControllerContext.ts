interface HarvestControllerContext {
  getSources: () => Source[];
  getSourceBoundRoom: (source: Source) => Room;
  getSourceBoundContainerPos: (source: Source) => RoomPosition;

  getPositionBoundCreeps: (containerPos: RoomPosition) => Creep[];
  eliminateCreep: (creep: Creep) => void;

  log: (message: string) => void;
}
