import { err } from "../Message";

export function getCreepType(creepName: string): CreepType | undefined {
  return getCreepTypeByString(creepName.split("_")[0]);
}

export enum CreepType {
  HARVESTER,
  CARRIER,
  CCARRIER,
  REPAIRER,
  CONSTRUCTOR,
  UPGRADER,
  RESERVER,

  SRHARVESTER,
  SRCARRIER
}
export function getCreepTypeList() {
  return Object.values(CreepType).filter(v => typeof v === "number") as CreepType[];
}

function getCreepTypeByString(value: string): CreepType | undefined {
  // @ts-ignore
  let a = CreepType[value];
  if (a !== undefined) return a as CreepType;
  return undefined;
}
