export const SourceRoomMemoryController = function (context: SourceRoomMemoryContext) {
  let sourceRoomMemories: { [name: string]: SRMemory } = {};

  const prerun = function () {
    // init source room memories
    for (const name of context.sourceRoomNames) {
      sourceRoomMemories[name] = Memory.rooms[name] as unknown as SRMemory;
    }
  };

  const getSRReadySourceNum = function (): number {
    let num = 0;
    for (const name in sourceRoomMemories) {
      const memory = sourceRoomMemories[name];
      if (memory.ready) num += memory.numSource;
    }
    return num;
  };

  const hasInvader = function (roomName: string): boolean {
    let memory = sourceRoomMemories[roomName];
    if (memory) return memory.hasInvader;
    else return false;
  }

  return { prerun, getSRReadySourceNum, hasInvader };
};

interface SourceRoomMemoryContext {
  sourceRoomNames: string[];
}
