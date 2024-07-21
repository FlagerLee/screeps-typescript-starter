import { RoomPositionToString, StringToRoomPosition } from "../../utils/utils";
import { isUndefined } from "lodash";

let layout: Map<StructureConstant, RoomPosition[]>[];
let boundMap: Map<string, Structure | RoomPosition>;

export function createRoomMemoryController(context: RoomMemoryControllerContext) {
  const preprocess = () => {
    const room = context.getRoom();
    const memory = room.memory;

    // init room memory
    if (isUndefined(memory.layout)) memory.layout = [];
    if (isUndefined(memory.boundMap)) memory.boundMap = [];
    if (isUndefined(memory.expressQueue)) memory.expressQueue = [];
    if (isUndefined(memory.spawnQueue)) memory.spawnQueue = [];
    if (isUndefined(memory.repairQueue)) memory.repairQueue = [];
    if (isUndefined(memory.expressPosterSet)) memory.expressPosterSet = [];
    if (isUndefined(memory.repairPosterSet)) memory.repairPosterSet = [];

    // parse layout
    layout = [];
    for (const item of memory.layout) {
      const map = new Map<StructureConstant, RoomPosition[]>();
      for (const entry of item) {
        const key = entry[0];
        const value = entry[1];
        const positions: RoomPosition[] = [];
        value.forEach(v => {
          positions.push(StringToRoomPosition(v, room));
        });
        map.set(key as StructureConstant, positions);
      }
      layout.push(map);
    }

    // parse boundMap
    boundMap = new Map<string, Structure | RoomPosition>();
    for (const item of memory.boundMap) {
      const key = item[0];
      const value = item[1];
      const ss = value.split("_");
      if (ss.length > 1) boundMap.set(key, StringToRoomPosition(value, room));
      else boundMap.set(key, Game.getObjectById(value as Id<Structure>)!);
    }
  };

  const getLayout = () => {
    return layout;
  };

  const getBoundMap = () => {
    return boundMap;
  };

  const postprocess = () => {
    const room = context.getRoom();
    const memory = room.memory;

    // convert layout
    memory.layout = [];
    for (const item of layout) {
      const map = new Map<string, string[]>();
      item.forEach((value, key) => {
        const positions: string[] = [];
        value.forEach(v => {
          positions.push(RoomPositionToString(v));
        });
        map.set(key, positions);
      });
      memory.layout.push(Array.from(map.entries()));
    }

    // convert boundMap
    const m = new Map<string, string>();
    boundMap.forEach((value, key) => {
      m.set(key, value instanceof RoomPosition ? RoomPositionToString(value) : value.id);
    });
    memory.boundMap = Array.from(m.entries());
  };

  return { preprocess, getLayout, getBoundMap, postprocess };
}
