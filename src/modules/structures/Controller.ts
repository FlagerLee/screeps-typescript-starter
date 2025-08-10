import { err } from "../Message";

function error(message: string) {
  err(`[STRUCTURE CONTROLLER] ${message}`);
}

export const SController = {
  run(
    controller: StructureController,
    getLevel: () => number,
    updateLevel: (lv: number) => void,
    setUpdateCreepFlag: () => void,
    addConstructTask: (task: ConstructTask) => void,
    createLayout: (createFn: (x: number, y: number, type: BuildableStructureConstant) => void) => void
  ) {
    // check level
    const room = controller.room;
    let level = getLevel();
    if (controller.level > level) {
      createLayout((x: number, y: number, type: BuildableStructureConstant) => {
        const result = room.createConstructionSite(x, y, type);
        switch (result) {
          case OK:
            addConstructTask({
              tgt: `|${x}|${y}|${room.name}`
            } as ConstructTask);
            break;
          default:
            error(`Unhandled construction error code ${result}, type = ${type}, position = (${x}, ${y})`);
        }
      });
      updateLevel(controller.level);
      setUpdateCreepFlag();
    }
  }
};
