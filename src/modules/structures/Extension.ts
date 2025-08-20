import { TRANSFER_PRIORITY_EXTENSION } from "../Constants";

export const SExtension = {
  run(extension: StructureExtension, addTransferTask: (task: TransferTask) => void) {
    if (extension.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
      addTransferTask({
        position: { x: extension.pos.x, y: extension.pos.y },
        target: extension.id,
        resourceType: RESOURCE_ENERGY,
        priority: TRANSFER_PRIORITY_EXTENSION,
        resourceNum: extension.store.getFreeCapacity(RESOURCE_ENERGY),
        reservedNum: 0
      });
  }
};
