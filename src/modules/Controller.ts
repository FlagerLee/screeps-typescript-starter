import { CreepController } from "./creeps/Controller";
// import { SpawnController } from "./Spawn";
import { StructuresController } from "./structures/StructuresController";
import { RoomMemoryController } from "./memory/RoomMemory";
import { DefenseController } from "./defense/Controller";
import { LayoutController } from "./layout/Controller";
import { SourceRoomController } from "./structures/SourceRoomController";
import { err, info } from "./Message";
import { CreepAPI } from "./creeps/CreepAPI";

export const MainController = {
  run(): void {
    const rooms = _.filter(Game.rooms, room => room.controller && room.controller.my);
    for (const room of rooms) {
      this.checkAndInitRoom(room);
      if (room.memory.Debug) continue;
      // create controller
      const layoutController = LayoutController({ room: room });
      const roomMemoryController = RoomMemoryController({ room: room });
      // const spawnController = SpawnController({ room: room });
      const defenseController = DefenseController({
        room: room
      });
      const structureController = StructuresController({
        room: room,
        addRepairTask: roomMemoryController.addRepairTask,
        addCarryTask: roomMemoryController.addCarryTask,
        getAttackTarget: defenseController.getAttackTarget,
        createLayout: layoutController.createLayout,
        getRampartTargetHits: layoutController.getRampartTargetHits,
        addEmergencyRepairTask: roomMemoryController.addEmergencyRepairTask,
        fetchEmergencyRepairTask: roomMemoryController.fetchEmergencyRepairTask,
        finishEmergencyRepairTask: roomMemoryController.finishEmergencyRepairTask,
        getCenter: roomMemoryController.getCenter,
        getLevel: roomMemoryController.getLevel,
        updateLevel: roomMemoryController.updateLevel,
        setUpdateCreepFlag: roomMemoryController.setUpdateCreepFlag,
        getTowerMemory: roomMemoryController.getTowerMemory,
        fetchSpawnTask: roomMemoryController.fetchSpawnTask,
        returnSpawnTask: roomMemoryController.returnSpawnTask,
        addConstructTask: roomMemoryController.addConstructTask
      });
      const creepController = CreepController({
        spawnFunc: (name: string): void => {
          // check if name exists in room creeps
          if (!roomMemoryController.getCreeps().includes(name)) return;
          // create spawn task
          let config = CreepAPI.getCreepConfig(name, { getCreepType: true });
          roomMemoryController.addSpawnTask({ name: name, type: config.creepType!, spawn: null } as SpawnTask);
        },
        room: room,
        fetchCarryTask: roomMemoryController.fetchCarryTask,
        returnCarryTask: roomMemoryController.returnCarryTask,
        finishCarryTask: roomMemoryController.finishCarryTask,
        fetchRepairTask: roomMemoryController.fetchRepairTask,
        returnRepairTask: roomMemoryController.returnRepairTask,
        finishRepairTask: roomMemoryController.finishRepairTask,
        fetchConstructTask: roomMemoryController.fetchConstructTask,
        finishConstructTask: roomMemoryController.finishConstructTask,
        getCenterContainer: structureController.getCenterContainer,
        transferToCenterContainer: structureController.transferToCenterContainer,
        getSourceRooms: roomMemoryController.getSourceRooms,
        setUpdateCreepFlag: roomMemoryController.setUpdateCreepFlag,
        getUpdateCreepFlag: roomMemoryController.getUpdateCreepFlag,
        getCreeps: roomMemoryController.getCreeps,
        addCreeps: roomMemoryController.addCreeps,
        removeCreeps: roomMemoryController.removeCreeps
      });
      const sourceRoomController = SourceRoomController({
        getFatherCenter: (): RoomPosition => {
          return roomMemoryController.getCenter();
        },
        createConstructionSiteByPath: (path: RoomPosition[]): void => {
          console.log(path.length);
          if (path.length == 0) {
            err(`[MAIN CONTROLLER] path is null`);
            return;
          }
          let containerPos = path.pop()!;
          let cq = [];
          for (let pos of path) {
            // exclude center
            if (pos.roomName === room.name && layoutController.checkPositionInsideLayout(pos.x, pos.y)) continue;
            let r = Game.rooms[pos.roomName]!;
            let result = r.createConstructionSite(pos, STRUCTURE_ROAD);
            switch (result) {
              case ERR_INVALID_ARGS:
                err(`Put construction site on invalid position, room = ${pos.roomName}, pos = (${pos.x}, ${pos.y})`);
                break;
              case OK:
                cq.push({ tgt: `|${pos.x}|${pos.y}|${pos.roomName}` } as ConstructTask);
                break;
              default:
                err(`Unhandled createConstructionSite error code ${result}`);
            }
          }
          // create container
          let r = Game.rooms[containerPos.roomName]!;
          let result = r.createConstructionSite(containerPos, STRUCTURE_CONTAINER);
          switch (result) {
            case ERR_INVALID_ARGS:
              err(
                `Put construction site on invalid position, room = ${containerPos.roomName}, pos = (${containerPos.x}, ${containerPos.y})`
              );
              break;
            case OK:
              cq.push({ tgt: `|${containerPos.x}|${containerPos.y}|${containerPos.roomName}` } as ConstructTask);
              break;
            default:
              err(`Unhandled createConstructionSite error code ${result}`);
          }
          // push cq
          roomMemoryController.addConstructTaskList(cq.reverse());
        },
        updateCreepCheckFlag: roomMemoryController.setUpdateCreepFlag
      });

      // prerun
      creepController.prerun();

      // run
      for (let srName of roomMemoryController.getSourceRooms()) sourceRoomController.run(srName);
      // spawnController.run();
      structureController.run();
      creepController.run();

      // postrun
      roomMemoryController.postRun();
      structureController.postRun();
    }
  },

  checkAndInitRoom(room: Room): void {
    if (room.memory.Debug == undefined) {
      const spawnPos = room.spawn[0].pos;
      Memory.rooms[room.name] = {
        Debug: false,
        tm: {},
        creeps: [],
        caq: [],
        cis: [],
        rq: [],
        erq: [],
        ris: [],
        eris: [],
        cq: [],
        sq: [],
        fb: false,
        fbc: -1,
        sr: [],
        center: { x: spawnPos.x - 1, y: spawnPos.y },
        lv: 0,
        lastCreepCheck: 0,
        creepConfigUpdate: true
      };
    }
  },

  checkAndInit(): void {
    if (Memory.rooms == undefined || Object.keys(Memory.rooms).length == 0) {
      // init
      Memory.rooms = {};
      Memory.creeps = {};
      Memory.flags = {};
      Memory.spawns = {};
    }
  }
};
