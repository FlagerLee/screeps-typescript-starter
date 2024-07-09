interface containerContext {
  addRepairTask: (task: RepairTask) => void;
}

const REPAIR_THRESHOLD = 0.8;

export function run(container: StructureContainer, context: containerContext): void {
  // submit repair task
  if (container.hits < container.hitsMax * REPAIR_THRESHOLD) {
    context.addRepairTask({ structure: container, postTime: 0 });
  }
}
