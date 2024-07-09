export function createUpgradeController(context: UpgradeControllerContext): { run: () => void } {
  const run = function () {
    const controller = context.getController();
    const boundCreeps = context.getPositionBoundCreeps(controller.pos);
    for (const creep of boundCreeps) {
      // execute creep action
      const energyCarried = creep.store.energy;
      if (energyCarried === 0) {
        const sourcePos = context.getControllerEnergySourcePos(controller);
        const tiles = controller.room.lookAt(sourcePos);
        for (const tile of tiles) {
          if (tile.type === "resource") {
            if (creep.pickup(tile.resource!) === ERR_NOT_IN_RANGE) creep.moveTo(sourcePos);
            break;
          } else if (tile.type === "structure") {
            if (tile.structure!.structureType !== STRUCTURE_CONTAINER) continue;
            const err = creep.withdraw(tile.structure!, RESOURCE_ENERGY);
            if (err === ERR_NOT_IN_RANGE) creep.moveTo(sourcePos);
            else if (err === ERR_NOT_ENOUGH_RESOURCES) context.warn(`Container ${tile.structure!.id} lack of resource`);
            else if (err === ERR_INVALID_TARGET) context.err(`Structure ${tile.structure!.id} is not a container`);
            break;
          }
        }
      } else {
        if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) creep.moveTo(controller);
      }
    }
  };

  return { run };
}
