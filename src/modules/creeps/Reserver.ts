import { err } from "../Message";

function error(message: string) {
  err(`[RESERVER] ${message}`);
}

export const Creep_reserver = {
  run(creep: Creep, room: Room, getSourceRooms: () => string[]) {
    if (creep.spawning) return;
    let infoList = creep.name.split("_");
    let index = parseInt(infoList[1]);
    let sr = getSourceRooms();
    if (index >= sr.length) return;

    // check data
    if (!creep.memory.data) {
      // init memory data
      creep.memory.data = { pos: null } as Reserver_data;
    }
    let data = creep.memory.data as Reserver_data;

    let srName = sr[index];
    let sRoom = Game.rooms[srName];
    if (sRoom) {
      let sRoomMemory = sRoom.memory as unknown as SRMemory;
      if (sRoomMemory.hasInvader) {
        creep.moveTo(room.controller!);
        return;
      }
    }

    if (creep.room.name !== srName) {
      if (data.pos) creep.moveTo(new RoomPosition(data.pos.x, data.pos.y, srName));
      else creep.moveTo(new RoomPosition(25, 25, srName));
    } else {
      let controller = creep.room.controller;
      if (!controller) {
        error(`No controller in room ${creep.room.name}`);
        return;
      }
      if (!data.pos) data.pos = { x: controller.pos.x, y: controller.pos.y };
      let result = creep.reserveController(controller);
      switch (result) {
        case ERR_NOT_IN_RANGE:
          creep.moveTo(controller.pos);
          break;
        case OK:
          break;
        default:
          error(`Unhandled reserve error code ${result}`);
      }
    }
  }
};

interface Reserver_data {
  pos: { x: number; y: number } | null;
}
