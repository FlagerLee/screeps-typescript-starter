export const DefenseController = function (context: DefenseControllerContext) {
  const getAttackTarget = function (): AnyCreep | Structure | null {
    let creeps = getHostileCreeps();
    if (creeps.length > 0) return creeps[0];
    let powerCreeps = getHostilePowerCreeps();
    if (powerCreeps.length > 0) return powerCreeps[0];
    return null;
  };

  const getHostileCreeps = function (): Creep[] {
    return context.room.find(FIND_HOSTILE_CREEPS);
  };

  const getHostilePowerCreeps = function (): PowerCreep[] {
    return context.room.find(FIND_HOSTILE_POWER_CREEPS);
  };

  return { getAttackTarget, getHostileCreeps, getHostilePowerCreeps };
};

interface DefenseControllerContext {
  room: Room;
}
