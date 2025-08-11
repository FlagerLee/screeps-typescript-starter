import { lookRangeStructure } from "../../utils/ToolFunction";

export function transferMemory(room: Room) {
  // let memory = room.memory;
  // // init user structure memories
  // memory.userStructureMemories = {
  //   towerMemories: memory.tm,
  //   containerMemories: {}
  // };
  //
  // // init game structure memories
  // let sourceMemories: { [id: string]: SourceMemory } = {};
  // for (const source of room.source) {
  //   let sourceMemory: SourceMemory = { container: null, link: null };
  //   let container = lookRangeStructure(room, source.pos.x, source.pos.y, 1, STRUCTURE_CONTAINER);
  //   if (container) {
  //     sourceMemory.container = container.id;
  //     let link = lookRangeStructure(room, container.pos.x, container.pos.y, 1, STRUCTURE_LINK);
  //     if (link) sourceMemory.link = link.id;
  //   }
  //   sourceMemories[source.id] = sourceMemory;
  // }
  // memory.gameStructureMemories = {
  //   sourceMemories: sourceMemories
  // };
  //
  // // init task memories
  // memory.tasks = {
  //   carryTasks: {taskQueue: memory.caq, idSet: memory.cis},
  //   repairTasks: {taskQueue: memory.rq, idSet: memory.ris},
  //   emergencyRepairTasks: {taskQueue: memory.erq, idSet: memory.eris},
  //   constructionTasks: {taskQueue: memory.cq},
  //   spawnTasks: {taskQueue: memory.sq},
  // }
  //
  // // init flag memories
  // memory.flags = {
  //   creepUpdateFlag: memory.creepConfigUpdate,
  //   creepUpdateTime: memory.lastCreepCheck,
  //   stopFlag: memory.Debug,
  //   memoryUpdateFlag: false,
  //   level: memory.lv
  // }
  //
  // memory.sourceRooms = memory.sr;
  // memory.center = new RoomPosition(memory.center.x, memory.center.y, room.name);
  //
  // // @ts-ignore
  // delete memory.Debug;
  // // @ts-ignore
  // delete memory.tm;
  // // @ts-ignore
  // delete memory.caq;
  // // @ts-ignore
  // delete memory.cis;
  // // @ts-ignore
  // delete memory.rq;
  // // @ts-ignore
  // delete memory.erq;
  // // @ts-ignore
  // delete memory.ris;
  // // @ts-ignore
  // delete memory.eris;
  // // @ts-ignore
  // delete memory.cq;
  // // @ts-ignore
  // delete memory.sq;
  // // @ts-ignore
  // delete memory.fb;
  // // @ts-ignore
  // delete memory.fbc;
  // // @ts-ignore
  // delete memory.sr;
  // // @ts-ignore
  // delete memory.lv;
  // // @ts-ignore
  // delete memory.lastCreepCheck;
  // // @ts-ignore
  // delete memory.creepConfigUpdate;
}
