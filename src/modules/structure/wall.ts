interface wallContext {
  addRepairTask: (task: RepairTask) => void;
}

const REPAIR_THRESHOLD = 0.8;

export function run(wall: StructureWall, context: wallContext): void {
  // submit repair task
  if (wall.hits < wall.hitsMax * REPAIR_THRESHOLD) {
    context.addRepairTask({
      structure: wall,
      postTime: 0
    });
  }
}
