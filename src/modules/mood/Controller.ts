import { Develop_mood } from "./develop";
import { err } from "../Message";
import { CreepType } from "../creeps/CreepAPI";

function error(message: string) {
  err(`[MOOD CONTROLLER] ${message}`);
}

export const MoodController = function (context: MoodControllerContext) {
  const getCreepConfig = function (creepName: string): [BodyPartConstant[], number] | null {
    const mood = context.getMood();
    switch (mood) {
      case Mood.DEVELOP:
        return Develop_mood({
          room: context.room,
          getNumConstructionSite: context.getNumConstructionSite,
          getNumRepairTask: context.getNumRepairTask,
          getNumSourceRooms: context.getNumSourceRooms,
          getSRReadySourceNum: context.getSRReadySourceNum,
          carrierAlive: context.carrierAlive
        }).getCreepConfig(creepName);
      default:
        error(`Unhandled mood: ${mood} in function getCreepConfig`);
        return null;
    }
  };

  const getCreepNum = function (creepType: CreepType): number | null {
    const mood = context.getMood();
    switch (mood) {
      case Mood.DEVELOP:
        return Develop_mood({
          room: context.room,
          getNumConstructionSite: context.getNumConstructionSite,
          getNumRepairTask: context.getNumRepairTask,
          getNumSourceRooms: context.getNumSourceRooms,
          getSRReadySourceNum: context.getSRReadySourceNum,
          carrierAlive: context.carrierAlive
        }).getCreepNum(creepType);
      default:
        error(`Unhandled mood: ${mood} in function getCreepNum`);
        return null;
    }
  };

  return { getCreepConfig, getCreepNum };
};

export enum Mood {
  DEVELOP = "develop"
}

interface MoodControllerContext {
  room: Room;
  getNumConstructionSite: () => number;
  getNumRepairTask: () => number;
  getNumSourceRooms: () => number;
  getSRReadySourceNum: () => number;
  carrierAlive: () => boolean;
  getMood: () => Mood;
}
