interface roadContext {
  addRepairTask: (task: RepairTask) => void;
}

const REPAIR_THRESHOLD = 0.8;

export function run(road: StructureRoad, context: roadContext): void {
  // submit repair task
  if (road.hits < road.hitsMax * REPAIR_THRESHOLD) {
    context.addRepairTask({ structure: road, postTime: 0 });
  }
}
