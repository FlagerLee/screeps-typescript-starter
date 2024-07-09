interface BunkerControllerContext {
  getRoom: () => Room;

  addConstructTask: (task: ConstructTask) => void;
}
