interface BunkerControllerContext {
  getRoom: () => Room;

  addConstructTask: (task: ConstructTask) => void;

  log: (message: string) => void;
}
