import { ErrorMapper } from "utils/errorMapper";
import { createController } from "./modules/controller";
import { isUndefined } from "lodash";

declare global {
  /*
    Example types, expand on these or remove them and add your own.
    Note: Values, properties defined here do no fully *exist* by this type definition alone.
          You must also give them an implementation if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

    Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
    Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */

  // Syntax for adding properties to `global` (ex "global.log")
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      log: any;
    }
  }
}

// eslint-disable-next-line no-underscore-dangle
function _log(message: string): void {
  console.log(`%c${message}`, "color: green");
}
// eslint-disable-next-line no-underscore-dangle
function _warn(message: string): void {
  console.log(`%c${message}`, "color: yellow");
}
// eslint-disable-next-line no-underscore-dangle
function _err(message: string): void {
  console.log(`%c${message}`, "color: red");
  Memory.stop = true;
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  // init memory
  if (isUndefined(Memory.genLayout)) Memory.genLayout = true;
  if (isUndefined(Memory.debug)) Memory.debug = true;
  if (isUndefined(Memory.stop)) Memory.stop = false;

  if (!Memory.stop || !Memory.debug) {
    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
      if (!(name in Game.creeps)) {
        delete Memory.creeps[name];
      }
    }
    try {
      const controller = createController({
        log: _log,
        warn: _warn,
        err: _err
      });
      controller.run();
    } catch (e) {
      _err((e as Error).message);
    }
  }
});
