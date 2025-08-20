export function lookStructure(room: Room, x: number, y: number, type: StructureConstant): Structure | null {
  let structures = room.lookForAt(LOOK_STRUCTURES, x, y);
  for (let structure of structures) {
    if (structure.structureType == type) return structure;
  }
  return null;
}

export function lookRangeStructure(
  room: Room,
  x: number,
  y: number,
  range: number,
  type: StructureConstant
): Structure | null {
  let structures = room.lookForAtArea(LOOK_STRUCTURES, y - range, x - range, y + range, x + range, true);
  for (let structure of structures) {
    if (structure.structure.structureType == type) return structure.structure;
  }
  return null;
}

export function chebyshevDistance(pos1: RoomPosition, pos2: RoomPosition) {
  return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
}

export function searchPath(from: RoomPosition, to: RoomPosition, range: number | undefined): PathFinderPath {
  function roomCallback(roomName: string): boolean | CostMatrix {
    let room = Game.rooms[roomName];
    if (!room) return false;
    let costs = new PathFinder.CostMatrix();
    room.find(FIND_STRUCTURES).forEach(function (struct) {
      if (struct.structureType === STRUCTURE_ROAD) {
        // 相对于平原，寻路时将更倾向于道路
        costs.set(struct.pos.x, struct.pos.y, 1);
      } else if (
        struct.structureType !== STRUCTURE_CONTAINER &&
        (struct.structureType !== STRUCTURE_RAMPART || !struct.my)
      ) {
        // 不能穿过无法行走的建筑
        costs.set(struct.pos.x, struct.pos.y, 0xff);
      }
    });
    return costs;
  }

  if (range === undefined)
    return PathFinder.search(from, to, {
      plainCost: 2,
      swampCost: 2,
      roomCallback
    });
  else
    return PathFinder.search(
      from,
      { pos: to, range: range },
      {
        plainCost: 2,
        swampCost: 2,
        roomCallback
      }
    );
}

//---------------Creep Action Error Message---------------//
export function attackMsg(code: number): string {
  return `Unhandled attack error code ${code}`;
}
export function buildMsg(code: number): string {
  return `Unhandled build error code ${code}`;
}
export function claimMsg(code: number): string {
  return `Unhandled claim error code ${code}`;
}
export function dismantleMsg(code: number): string {
  return `Unhandled dismantle error code ${code}`;
}
export function dropMsg(code: number): string {
  return `Unhandled drop error code ${code}`;
}
export function harvestMsg(code: number): string {
  return `Unhandled harvest error code ${code}`;
}
export function healMsg(code: number): string {
  return `Unhandled heal error code ${code}`;
}
export function pickupMsg(code: number): string {
  return `Unhandled pickup error code ${code}`;
}
export function rangedAttackMsg(code: number): string {
  return `Unhandled rangedAttack error code ${code}`;
}
export function rangedHealMsg(code: number): string {
  return `Unhandled rangedHeal error code ${code}`;
}
export function rangedMassAttackMsg(code: number): string {
  return `Unhandled rangedMassAttack error code ${code}`;
}
export function repairMsg(code: number): string {
  return `Unhandled repair error code ${code}`;
}
export function reserveMsg(code: number): string {
  return `Unhandled reserve error code ${code}`;
}
export function transferMsg(code: number): string {
  return `Unhandled transfer error code ${code}`;
}
export function upgradeMsg(code: number): string {
  return `Unhandled upgrade error code ${code}`;
}
export function withdrawMsg(code: number): string {
  return `Unhandled withdraw error code ${code}`;
}
//-------------Creep Action Error Message End-------------//

export function creepAtBoarder(pos: RoomPosition): boolean {
  return pos.x == 0 || pos.x == 49 || pos.y == 0 || pos.y == 49;
}
