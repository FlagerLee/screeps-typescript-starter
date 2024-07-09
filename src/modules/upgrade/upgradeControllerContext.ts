interface UpgradeControllerContext {
  getController: () => StructureController;

  getPositionBoundCreeps: (containerPos: RoomPosition) => Creep[];
  getControllerEnergySourcePos: (controller: StructureController) => RoomPosition;

  log: (message: string) => void;
  err: (message: string) => void;
  warn: (message: string) => void;
}
