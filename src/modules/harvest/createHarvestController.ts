import { HARVEST_CREEP_STATE, creepConfig } from "../creepConfig";

export function createHarvestController(context: HarvestControllerContext): { run: () => void } {
  const run = function () {
    for (const source of context.getSources()) {
      const boundCreep = context.getPositionBoundCreeps(source.pos);
      for (const creep of boundCreep) {
        // execute creep action
        const containerPos = context.getSourceBoundContainerPos(source);
        const creepPos = creep.pos;
        // creep not on container
        if (containerPos.x !== creepPos.x || containerPos.y !== creepPos.y) {
          // if the Chebyshev distance between container and creep is 1, judge if there is a harvester with state suicide
          const dist = Math.max(Math.abs(containerPos.x - creepPos.x), Math.abs(containerPos.y - creepPos.y));
          if (dist === 1) {
            const containerCreepArray = containerPos.lookFor(LOOK_CREEPS);
            const size = containerCreepArray.length;
            if (
              size === 1 &&
              containerCreepArray[0].memory.role === creepConfig.HARVEST_CREEP_ROLE &&
              containerCreepArray[0].memory.state === HARVEST_CREEP_STATE.STATE_SUICIDE
            ) {
              // suicide now
              if (!containerCreepArray[0].my) context.eliminateCreep(containerCreepArray[0]);
              else containerCreepArray[0].suicide();
            }
          }
          // move to container
          creep.moveTo(containerPos);
        } else {
          creep.harvest(source);
        }
      }
    }
  };

  return { run };
}
