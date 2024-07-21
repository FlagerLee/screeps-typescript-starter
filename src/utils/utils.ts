import { isUndefined } from "lodash";

export function RoomPositionToString(position: RoomPosition): string {
  return `${position.x}_${position.y}_${position.roomName}`;
}

export function StringToRoomPosition(str: string, room: Room): RoomPosition {
  const s = str.split("_");
  return room.getPositionAt(Number(s[0]), Number(s[1]))!;
}

export function StringToRoomPositionWithoutRoom(str: string): RoomPosition {
  const s = str.split("_");
  return Game.rooms[s[2]].getPositionAt(Number(s[0]), Number(s[1]))!;
}

export function ExpressTaskToString(task: ExpressTask): string {
  return JSON.stringify(task);
}

export function StringToExpressTask(str: string): ExpressTask {
  return JSON.parse(str, (key, value) => {
    if (key === "boundPos") {
      if (isUndefined(value)) return undefined;
      else return StringToRoomPositionWithoutRoom(value as string);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return value;
  }) as ExpressTask;
}

export function SpawnTaskToString(task: SpawnTask): string {
  return JSON.stringify(task, (key, value) => {
    if (key === "boundPos") {
      if (isUndefined(value)) return undefined;
      else return RoomPositionToString(value as RoomPosition);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return value;
  });
}

export function StringToSpawnTask(str: string): SpawnTask {
  return JSON.parse(str) as SpawnTask;
}

export function ConstructTaskToString(task: ConstructTask): string {
  return `${task.pos.x}_${task.pos.y}_${task.pos.roomName}_${task.type}_${task.postTime}`;
}

export function StringToConstructTask(str: string): ConstructTask {
  const s = str.split("_");
  return {
    pos: Game.rooms[s[2]]!.getPositionAt(Number(s[0]), Number(s[1]))!,
    type: s[3] as StructureConstant,
    postTime: Number(s[4])
  };
}

export function RepairTaskToString(task: RepairTask): string {
  return JSON.stringify(task);
}

export function StringToRepairTask(str: string): RepairTask {
  return JSON.parse(str) as RepairTask;
}
