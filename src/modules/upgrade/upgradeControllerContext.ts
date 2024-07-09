interface UpgradeControllerContext {
  getController: () => StructureController;

  getPositionBoundCreeps: (containerPos: RoomPosition) => Creep[];
  getControllerEnergySourcePos: (controller: StructureController) => RoomPosition;

  err: (message: string) => void;
  warn: (message: string) => void;
}
