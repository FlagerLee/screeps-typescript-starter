interface ExpressControllerContext {
  peekExpressTask: () => ExpressTask | null;
  getExpressTask: () => ExpressTask | null;
  addExpressTask: (task: ExpressTask) => void;
  finishTask: (task: ExpressTask) => void;

  getAvailableSource: (resourceType: ResourceConstant) => Structure | RoomPosition | null;

  getCreepsByRole: (role: string) => Creep[];
  getNumCreepsByRole: (role: string) => number; // include creeps added to spawn queue

  err: (message: string) => void;
  warn: (message: string) => void;
}
