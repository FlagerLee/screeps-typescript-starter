interface ConstructControllerContext {
  getConstructionSite: () => ConstructionSite | null;

  getAvailableSource: (resourceType: ResourceConstant, room?: Room) => Structure | RoomPosition | null;

  getCreepsByRole: (role: string) => Creep[];
  getNumCreepsByRole: (role: string) => number; // include creeps added to spawn queue

  err: (message: string) => void;
  warn: (message: string) => void;
}
