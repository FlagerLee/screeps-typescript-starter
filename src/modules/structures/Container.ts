import { chebyshevDistance } from "../../utils/ToolFunction";
import { err } from "../Message";
import { CONTAINER_ROLE } from "../memory/definition";
import { TRANSFER_PRIORITY_CONTROLLER_CONTAINER } from "../Constants";

export const SContainer = {
  run(
    container: StructureContainer,
    addRepairTask: (task: RepairTask) => void,
    addEmergencyRepairTask: (task: RepairTask) => void,
    addCarryTask: (task: CarryTask) => void,
    addTransferTask: (task: TransferTask) => void,
    getCenter: () => RoomPosition,
    getCenterContainer: () => StructureStorage | StructureContainer | null,
    getContainerMemory: (id: Id<StructureContainer>) => ContainerMemory | undefined,
    setContainerMemory: (id: Id<StructureContainer>, memory: ContainerMemory) => void
  ) {
    const room = container.room;
    // repair task
    if (container.hits < container.hitsMax * 0.75)
      addRepairTask({
        tgt: container.id,
        hits: container.hitsMax,
        sn: STRUCTURE_CONTAINER
      });
    // emergency repair task
    if (container.hits < 15000)
      addEmergencyRepairTask({
        tgt: container.id,
        hits: 30000,
        sn: STRUCTURE_CONTAINER
      });

    // check memory
    let memory = getContainerMemory(container.id);
    if (!memory) {
      // init memory
      function initMemory() {
        // check center
        if (getCenter().isEqualTo(container.pos)) {
          setContainerMemory(container.id, {
            role: CONTAINER_ROLE.CONTAINER_CENTER,
            position: { x: container.pos.x, y: container.pos.y },
            resourceType: RESOURCE_ENERGY
          });
          return;
        }
        let x = container.pos.x,
          y = container.pos.y;
        // check source
        let sourceResult = room.lookForAtArea(LOOK_SOURCES, y - 1, x - 1, y + 1, x + 1, true);
        if (sourceResult.length > 0) {
          setContainerMemory(container.id, {
            role: CONTAINER_ROLE.CONTAINER_SOURCE,
            position: { x: container.pos.x, y: container.pos.y },
            resourceType: RESOURCE_ENERGY
          });
          return;
        }
        // check mineral
        if (room.mineral && chebyshevDistance(container.pos, room.mineral!.pos) == 1) {
          setContainerMemory(container.id, {
            role: CONTAINER_ROLE.CONTAINER_MINERAL,
            position: { x: container.pos.x, y: container.pos.y },
            resourceType: room.mineral!.mineralType
          });
          return;
        }
        // check controller
        if (chebyshevDistance(container.pos, room.controller!.pos) <= 3) {
          setContainerMemory(container.id, {
            role: CONTAINER_ROLE.CONTAINER_CONTROLLER,
            position: { x: container.pos.x, y: container.pos.y },
            resourceType: RESOURCE_ENERGY
          });
          return;
        }
        setContainerMemory(container.id, {
          role: CONTAINER_ROLE.UNKNOWN,
          position: { x: container.pos.x, y: container.pos.y },
          resourceType: RESOURCE_ENERGY
        });
      }
      initMemory();
    }
    memory = memory!;
    const centerContainer = getCenterContainer();
    if (!centerContainer) return;
    switch (memory.role) {
      case CONTAINER_ROLE.CONTAINER_CONTROLLER:
        if (container.store.energy < 500)
          addTransferTask({
            position: { x: container.pos.x, y: container.pos.y },
            target: container.id,
            resourceType: RESOURCE_ENERGY,
            priority: TRANSFER_PRIORITY_CONTROLLER_CONTAINER,
            resourceNum: container.store.getFreeCapacity(RESOURCE_ENERGY),
            reservedNum: 0
          });
        break;
      case CONTAINER_ROLE.CONTAINER_MINERAL:
        if (container.store.getUsedCapacity(memory.resourceType) > 100)
          addCarryTask({
            source: container.id,
            target: centerContainer.id,
            resourceType: memory.resourceType,
            mustFetch: true
          });
        break;
      case CONTAINER_ROLE.CONTAINER_SOURCE:
        if (container.store.energy > 200)
          addCarryTask({
            source: container.id,
            target: centerContainer.id,
            resourceType: RESOURCE_ENERGY,
            mustFetch: true
          });
        break;
      case CONTAINER_ROLE.CONTAINER_CENTER:
        if (container.store.getUsedCapacity() > 0 && room.storage) {
          for (const resourceType of RESOURCES_ALL) {
            if (container.store.getUsedCapacity(resourceType) > 0)
              addCarryTask({
                source: container.id,
                target: room.storage.id,
                resourceType: resourceType,
                mustFetch: true
              });
          }
        }
        break;
      default:
        err("[STRUCTURE CONTAINER] unknown container type");
    }
  }
};
