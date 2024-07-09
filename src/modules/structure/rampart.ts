interface rampartContext {
  addRepairTask: (task: RepairTask) => void;
}

const REPAIR_THRESHOLD = 0.8;

export function run(rampart: StructureRampart, context: rampartContext): void {
  // submit repair task
  if (rampart.hits < rampart.hitsMax * REPAIR_THRESHOLD) {
    context.addRepairTask({
      structure: rampart,
      postTime: 0
    });
  }
}
