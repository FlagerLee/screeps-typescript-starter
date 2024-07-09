interface extensionContext {
  addRepairTask: (task: RepairTask) => void;
  addExpressTask: (task: ExpressTask) => void;
}

const REPAIR_THRESHOLD = 0.5;

export function run(extension: StructureExtension, context: extensionContext): void {
  // submit repair task
  if (extension.hits < extension.hitsMax * REPAIR_THRESHOLD) {
    context.addRepairTask({ structure: extension, postTime: 0 });
  }
  // submit express task
  const currentEnergy = extension.store.energy;
  const maxEnergy = extension.store.getCapacity(RESOURCE_ENERGY);
  if (currentEnergy < maxEnergy) {
    context.addExpressTask({
      room: extension.room.name,
      poster: extension.id,
      resourceType: RESOURCE_ENERGY,
      amount: maxEnergy - currentEnergy,
      postTime: 0
    });
  }
}
