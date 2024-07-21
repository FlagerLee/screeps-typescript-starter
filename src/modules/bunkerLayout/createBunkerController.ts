// eslint-disable-next-line max-classes-per-file
import { PriorityQueue } from "utils/priorityQueue";
import { isUndefined } from "lodash";
import { RoomPositionToString, StringToRoomPosition } from "../../utils/utils";

const CENTRAL_MIN_DIST = 8;
const CONTROLLER_WEIGHT = 0.8;
const MINERAL_WEIGHT = 1.2;
const SOURCE_WEIGHT = 1.0;

class queueObj {
  public constructor(x: number, y: number, dist: number) {
    this.x = x;
    this.y = y;
    this.dist = dist;
  }
  public x: number;
  public y: number;
  public dist: number;
}
function judge(o1: queueObj, o2: queueObj) {
  return o1.dist < o2.dist;
}

export function createBunkerController(context: BunkerControllerContext) {
  const createLayout = (): boolean => {
    const room = context.getRoom();
    const boundMap = context.getBoundMap();
    const layout = context.getLayout();

    // define tool function
    const xyToIdx = (x: number, y: number) => {
      return x * 50 + y;
    };
    const idxToXY = (idx: number) => {
      return [Math.floor(idx / 50), idx % 50];
    };
    const idxToPos = (idx: number): RoomPosition => {
      return room.getPositionAt(Math.floor(idx / 50), idx % 50)!;
    };
    // bfs to get bunker center
    const terrain = room.getTerrain();
    const visitBase = new Array(2500).fill(false) as boolean[];
    const distArray = new Array(2500).fill(0) as number[];
    const queue = new PriorityQueue<queueObj>(judge);
    // init visit array
    const visit = _.cloneDeep(visitBase);
    for (let x = 0; x < 50; x++)
      for (let y = 0; y < 50; y++) {
        const idx = xyToIdx(x, y);
        if (x === 0 || x === 49 || y === 0 || y === 49) visit[idx] = true;
        else visit[idx] = terrain.get(x, y) === TERRAIN_MASK_WALL;
      }
    // init queue
    const dx = [-1, -1, -1, 0, 1, 1, 1, 0];
    const dy = [-1, 0, 1, 1, 1, 0, -1, -1];
    const visitRecords: number[] = []; // record positions visited while initialize
    let visitRecordSize = 0;
    for (let x = 1; x < 49; x++)
      for (let y = 1; y <= 49; y++) {
        const idx = xyToIdx(x, y);
        if (visit[idx]) continue;
        let nearWall = false;
        for (let i = 0; i < 8; i++) {
          const deltaIdx = xyToIdx(x + dx[i], y + dy[i]);
          if (visit[deltaIdx]) {
            nearWall = true;
            break;
          }
        }
        if (nearWall) {
          queue.push(new queueObj(x, y, 1));
          visitRecords[visitRecordSize] = idx;
          visitRecordSize++;
        }
      }
    for (const visitRecord of visitRecords) {
      visit[visitRecord] = true;
    }
    // start bfs
    while (!queue.empty()) {
      const obj = queue.pop()!;
      distArray[obj.x * 50 + obj.y] = obj.dist;
      for (let i = 0; i < 8; i++) {
        const idx = xyToIdx(obj.x + dx[i], obj.y + dy[i]);
        if (!visit[idx]) {
          visit[idx] = true;
          queue.push(new queueObj(obj.x + dx[i], obj.y + dy[i], obj.dist + 1));
        }
      }
    }

    // flood fill from controller, mineral and sources
    const controllerDist = new Array(2500).fill(0) as number[];
    const mineralDist = new Array(2500).fill(0) as number[];
    const sourcesDists: number[][] = [];
    const floodfill = (distArr: number[], visitArr: boolean[], start: RoomPosition) => {
      const q = new PriorityQueue<queueObj>(judge);
      // init queue
      for (let i = 0; i < 8; i++) {
        const idx = xyToIdx(start.x + dx[i], start.y + dy[i]);
        if (!visit[idx]) {
          visit[idx] = true;
          q.push(new queueObj(start.x + dx[i], start.y + dy[i], 1));
        }
      }
      // start flood fill
      while (!q.empty()) {
        const obj = q.pop()!;
        distArr[obj.x * 50 + obj.y] = obj.dist;
        for (let i = 0; i < 8; i++) {
          const idx = xyToIdx(obj.x + dx[i], obj.y + dy[i]);
          if (!visit[idx]) {
            visit[idx] = true;
            q.push(new queueObj(obj.x + dx[i], obj.y + dy[i], obj.dist + 1));
          }
        }
      }
    };
    // controller
    floodfill(controllerDist, _.cloneDeep(visitBase), room.controller!.pos);
    // mineral
    const minerals = room.find(FIND_MINERALS);
    const numMinerals = minerals.length;
    if (numMinerals > 0) floodfill(mineralDist, _.cloneDeep(visitBase), minerals[0].pos);
    // source
    const sources = room.find(FIND_SOURCES);
    for (const source of sources) {
      const arr = new Array(2500).fill(0) as number[];
      floodfill(arr, _.cloneDeep(visitBase), source.pos);
      sourcesDists.push(arr);
    }
    // find center point
    let minDist = 100000;
    let centralPos: RoomPosition | undefined;
    for (let x = 0; x < 50; x++)
      for (let y = 0; y < 50; y++) {
        const idx = xyToIdx(x, y);
        if (distArray[idx] < CENTRAL_MIN_DIST) continue;
        let dist = controllerDist[idx] * CONTROLLER_WEIGHT + mineralDist[idx] * MINERAL_WEIGHT;
        for (const sourceDist of sourcesDists) {
          dist += sourceDist[idx] * SOURCE_WEIGHT;
        }
        if (dist < minDist) {
          minDist = dist;
          centralPos = room.getPositionAt(x, y)!;
        }
      }
    if (isUndefined(centralPos)) return false;
    centralPos = centralPos!;

    const X = centralPos.x;
    const Y = centralPos.y;
    const surroundingRoad = new Set<number>([
      xyToIdx(X, Y - 6),
      xyToIdx(X + 1, Y - 6),
      xyToIdx(X + 2, Y - 6),
      xyToIdx(X + 3, Y - 6),
      xyToIdx(X + 4, Y - 5),
      xyToIdx(X + 5, Y - 4),
      xyToIdx(X + 6, Y - 3),
      xyToIdx(X + 6, Y - 2),
      xyToIdx(X + 6, Y - 1),
      xyToIdx(X + 6, Y),
      xyToIdx(X + 6, Y + 1),
      xyToIdx(X + 6, Y + 2),
      xyToIdx(X + 6, Y + 3),
      xyToIdx(X + 5, Y + 4),
      xyToIdx(X + 4, Y + 5),
      xyToIdx(X + 3, Y + 6),
      xyToIdx(X + 2, Y + 6),
      xyToIdx(X + 1, Y + 6),
      xyToIdx(X, Y + 6),
      xyToIdx(X - 1, Y + 6),
      xyToIdx(X - 2, Y + 6),
      xyToIdx(X - 3, Y + 6),
      xyToIdx(X - 4, Y + 5),
      xyToIdx(X - 5, Y + 4),
      xyToIdx(X - 6, Y + 3),
      xyToIdx(X - 6, Y + 2),
      xyToIdx(X - 6, Y + 1),
      xyToIdx(X - 6, Y),
      xyToIdx(X - 6, Y - 1),
      xyToIdx(X - 6, Y - 2),
      xyToIdx(X - 6, Y - 3),
      xyToIdx(X - 5, Y - 4),
      xyToIdx(X - 4, Y - 5),
      xyToIdx(X - 3, Y - 6),
      xyToIdx(X - 2, Y - 6),
      xyToIdx(X - 1, Y - 6)
    ]);
    // level 1
    const containerPosArr = [] as RoomPosition[];
    {
      const level1Layout: Map<StructureConstant, RoomPosition[]> = new Map();
      // set container
      for (const source of sources) {
        const sourcePos = source.pos;
        for (let i = 0; i < 8; i++) {
          const x = sourcePos.x + dx[i];
          const y = sourcePos.y + dy[i];
          const idx = x * 50 + y;
          if (!visitBase[idx]) {
            // container position
            const containerPos = room.getPositionAt(x, y)!;
            containerPosArr.push(containerPos);
            boundMap.set(source.id, containerPos);
            break;
          }
        }
      }
      level1Layout.set(STRUCTURE_CONTAINER, containerPosArr);
      // set spawn
      level1Layout.set(STRUCTURE_SPAWN, [room.getPositionAt(X, Y - 3)] as RoomPosition[]);
      // find road to sources
      for (let i = 0; i < sources.length; i++) {
        let minDistance = 10000;
        let resPos = 0;
        for (const pos of surroundingRoad) {
          const dist = sourcesDists[i][pos];
          if (dist < minDistance) {
            minDistance = dist;
            resPos = pos;
          }
        }
        // start from resPos
        const paths = room.findPath(idxToPos(resPos), boundMap.get(sources[i].id) as RoomPosition, {
          ignoreCreeps: true
        });
        for (const step of paths) {
          const pos = room.getPositionAt(step.x, step.y)!;
          surroundingRoad.add(xyToIdx(pos.x, pos.y));
          visitBase[pos.x * 50 + pos.y] = true;
        }
      }
      // add the rest of roads
      const level1Road = new Set([...surroundingRoad]);
      level1Road.add(xyToIdx(X, Y - 5));
      level1Road.add(xyToIdx(X, Y - 4));
      level1Road.add(xyToIdx(X + 1, Y - 3));
      level1Road.add(xyToIdx(X + 1, Y - 2));
      level1Road.add(xyToIdx(X + 1, Y - 1));
      level1Road.add(xyToIdx(X + 2, Y));
      level1Road.add(xyToIdx(X + 1, Y + 1));
      level1Road.add(xyToIdx(X + 1, Y + 2));
      level1Road.add(xyToIdx(X + 1, Y + 3));
      level1Road.add(xyToIdx(X, Y + 4));
      level1Road.add(xyToIdx(X, Y + 5));
      level1Road.add(xyToIdx(X - 1, Y + 3));
      level1Road.add(xyToIdx(X - 1, Y + 2));
      level1Road.add(xyToIdx(X - 1, Y + 1));
      level1Road.add(xyToIdx(X - 2, Y));
      level1Road.add(xyToIdx(X - 1, Y - 1));
      level1Road.add(xyToIdx(X - 1, Y - 2));
      level1Road.add(xyToIdx(X - 1, Y - 3));

      level1Layout.set(
        STRUCTURE_ROAD,
        Array.from(level1Road.values(), s => {
          return idxToPos(s);
        })
      );

      layout.push(level1Layout);
    }
    // level 2
    {
      const level2Layout: Map<StructureConstant, RoomPosition[]> = new Map();
      // set extensions
      level2Layout.set(STRUCTURE_EXTENSION, [
        room.getPositionAt(X - 1, Y - 4),
        room.getPositionAt(X - 1, Y - 5),
        room.getPositionAt(X - 2, Y - 5),
        room.getPositionAt(X - 3, Y - 5),
        room.getPositionAt(X - 3, Y - 4)
      ] as RoomPosition[]);

      layout.push(level2Layout);
    }
    // level 3
    {
      const level3Layout: Map<StructureConstant, RoomPosition[]> = new Map();
      // set extensions
      level3Layout.set(STRUCTURE_EXTENSION, [
        room.getPositionAt(X - 4, Y - 4),
        room.getPositionAt(X - 4, Y - 3),
        room.getPositionAt(X - 5, Y - 3),
        room.getPositionAt(X - 5, Y - 2),
        room.getPositionAt(X - 5, Y)
      ] as RoomPosition[]);
      // set tower
      level3Layout.set(STRUCTURE_TOWER, [room.getPositionAt(X, Y - 2)] as RoomPosition[]);

      layout.push(level3Layout);
    }
    // level 4
    {
      const level4Layout: Map<StructureConstant, RoomPosition[]> = new Map();
      // set extensions
      level4Layout.set(STRUCTURE_EXTENSION, [
        room.getPositionAt(X - 2, Y - 3),
        room.getPositionAt(X - 2, Y - 2),
        room.getPositionAt(X - 3, Y - 2),
        room.getPositionAt(X - 3, Y - 1),
        room.getPositionAt(X - 4, Y - 1),
        room.getPositionAt(X - 4, Y),
        room.getPositionAt(X - 4, Y + 1),
        room.getPositionAt(X - 3, Y + 1),
        room.getPositionAt(X - 3, Y + 2),
        room.getPositionAt(X - 2, Y + 3)
      ] as RoomPosition[]);
      // set roads
      level4Layout.set(STRUCTURE_ROAD, [
        room.getPositionAt(X - 2, Y - 4),
        room.getPositionAt(X - 3, Y - 3),
        room.getPositionAt(X - 4, Y - 2),
        room.getPositionAt(X - 5, Y - 1),
        room.getPositionAt(X - 5, Y + 1),
        room.getPositionAt(X - 4, Y + 2),
        room.getPositionAt(X - 3, Y + 3),
        room.getPositionAt(X - 2, Y + 4),
        room.getPositionAt(X + 2, Y - 4),
        room.getPositionAt(X + 3, Y - 3),
        room.getPositionAt(X + 4, Y - 2),
        room.getPositionAt(X + 5, Y - 1),
        room.getPositionAt(X + 5, Y + 1),
        room.getPositionAt(X + 4, Y + 2),
        room.getPositionAt(X + 3, Y + 3),
        room.getPositionAt(X + 2, Y + 4)
      ] as RoomPosition[]);
      // set storage
      level4Layout.set(STRUCTURE_STORAGE, [room.getPositionAt(X, Y + 1)] as RoomPosition[]);

      layout.push(level4Layout);
    }
    // level 5
    {
      const level5Layout: Map<StructureConstant, RoomPosition[]> = new Map();
      // set extensions
      level5Layout.set(STRUCTURE_EXTENSION, [
        room.getPositionAt(X - 1, Y + 4),
        room.getPositionAt(X - 1, Y + 5),
        room.getPositionAt(X - 2, Y + 5),
        room.getPositionAt(X - 3, Y + 5),
        room.getPositionAt(X - 3, Y + 4),
        room.getPositionAt(X - 4, Y + 4),
        room.getPositionAt(X - 4, Y + 3),
        room.getPositionAt(X - 5, Y + 3),
        room.getPositionAt(X - 5, Y + 2),
        room.getPositionAt(X + 2, Y + 3)
      ] as RoomPosition[]);
      // set tower
      level5Layout.set(STRUCTURE_TOWER, [room.getPositionAt(X - 2, Y - 1)] as RoomPosition[]);
      // set links
      const linkPositions = [room.getPositionAt(X - 1, Y)] as RoomPosition[];
      const cX = containerPosArr[0].x;
      const cY = containerPosArr[0].y;
      for (let i = 0; i < 8; i++) {
        const idx = (cX + dx[i]) * 50 + (cY + dy[i]);
        if (!visitBase[idx]) {
          visitBase[idx] = true;
          linkPositions.push(room.getPositionAt(cX + dx[i], cY + dy[i])!);
          break;
        }
      }
      level5Layout.set(STRUCTURE_LINK, linkPositions);

      layout.push(level5Layout);
    }
    // level 6
    {
      const level6Layout: Map<StructureConstant, RoomPosition[]> = new Map();
      // set extensions
      level6Layout.set(STRUCTURE_EXTENSION, [
        room.getPositionAt(X + 1, Y + 4),
        room.getPositionAt(X + 1, Y + 5),
        room.getPositionAt(X + 2, Y + 5),
        room.getPositionAt(X + 3, Y + 5),
        room.getPositionAt(X + 3, Y + 4),
        room.getPositionAt(X + 4, Y + 4),
        room.getPositionAt(X + 4, Y + 3),
        room.getPositionAt(X + 5, Y + 3),
        room.getPositionAt(X + 5, Y + 2),
        room.getPositionAt(X + 3, Y + 2)
      ] as RoomPosition[]);
      // set link
      if (containerPosArr.length > 1) {
        for (let i = 0; i < 8; i++) {
          const cX = containerPosArr[1].x + dx[i];
          const cY = containerPosArr[1].y + dy[i];
          const idx = xyToIdx(cX, cY);
          if (!visitBase[idx]) {
            visitBase[idx] = true;
            level6Layout.set(STRUCTURE_LINK, [room.getPositionAt(cX, cY)] as RoomPosition[]);
            break;
          }
        }
      }
      // set extractor
      if (minerals.length > 0) {
        const mineral = minerals[0];
        const extractorPos = mineral.pos;
        level6Layout.set(STRUCTURE_EXTRACTOR, [extractorPos] as RoomPosition[]);
        // find road to mineral
        const mineralRoad: number[] = [];
        let minDistance = 10000;
        let resPos = 0;
        for (const pos of surroundingRoad) {
          const dist = mineralDist[pos];
          if (dist < minDistance) {
            minDistance = dist;
            resPos = pos;
          }
        }
        // start from resPos
        const paths = room.findPath(idxToPos(resPos), mineral.pos, {
          ignoreCreeps: true
        });
        for (const step of paths) {
          const pos = xyToIdx(step.x, step.y);
          if (surroundingRoad.has(pos)) continue;
          surroundingRoad.add(pos);
          mineralRoad.push(pos);
          visitBase[pos] = true;
        }
        level6Layout.set(
          STRUCTURE_ROAD,
          _.map(mineralRoad, s => {
            return idxToPos(s);
          })
        );
        // set container
        for (let i = 0; i < 8; i++) {
          const cX = extractorPos.x + dx[i];
          const cY = extractorPos.y + dy[i];
          const idx = xyToIdx(cX, cY);
          if (!visitBase[idx]) {
            visitBase[idx] = true;
            const pos = room.getPositionAt(cX, cY);
            level6Layout.set(STRUCTURE_CONTAINER, [pos] as RoomPosition[]);
            boundMap.set(mineral.id, pos!);
            break;
          }
        }
      }
      // set terminal
      level6Layout.set(STRUCTURE_TERMINAL, [room.getPositionAt(X + 1, Y)] as RoomPosition[]);

      layout.push(level6Layout);
    }
    // level 7
    {
      const level7Layout: Map<StructureConstant, RoomPosition[]> = new Map();
      // set extensions
      level7Layout.set(STRUCTURE_EXTENSION, [
        room.getPositionAt(X + 3, Y + 1),
        room.getPositionAt(X + 3, Y - 1),
        room.getPositionAt(X + 4, Y + 1),
        room.getPositionAt(X + 4, Y),
        room.getPositionAt(X + 4, Y - 1),
        room.getPositionAt(X + 5, Y),
        room.getPositionAt(X + 5, Y - 2),
        room.getPositionAt(X + 5, Y - 3),
        room.getPositionAt(X + 6, Y - 4),
        room.getPositionAt(X + 5, Y - 5)
      ] as RoomPosition[]);
      // set tower
      level7Layout.set(STRUCTURE_TOWER, [room.getPositionAt(X + 2, Y - 1)] as RoomPosition[]);
      // set link
      if (containerPosArr.length > 2) {
        for (let i = 0; i < 8; i++) {
          const cX = containerPosArr[2].x + dx[i];
          const cY = containerPosArr[2].y + dy[i];
          const idx = cX * 50 + cY;
          if (!visitBase[idx]) {
            visitBase[idx] = true;
            level7Layout.set(STRUCTURE_LINK, [room.getPositionAt(cX, cY)] as RoomPosition[]);
            break;
          }
        }
      }
      // set factory
      level7Layout.set(STRUCTURE_FACTORY, [room.getPositionAt(X + 1, Y)] as RoomPosition[]);
      // set spawn
      level7Layout.set(STRUCTURE_SPAWN, [room.getPositionAt(X + 2, Y + 2)] as RoomPosition[]);

      layout.push(level7Layout);
    }
    // level8
    {
      const level8Layout: Map<StructureConstant, RoomPosition[]> = new Map();
      // set extension
      level8Layout.set(STRUCTURE_EXTENSION, [
        room.getPositionAt(X + 4, Y - 6),
        room.getPositionAt(X - 4, Y - 6),
        room.getPositionAt(X - 5, Y - 5),
        room.getPositionAt(X - 6, Y - 4),
        room.getPositionAt(X - 6, Y + 4),
        room.getPositionAt(X - 5, Y + 5),
        room.getPositionAt(X - 4, Y + 6),
        room.getPositionAt(X + 4, Y + 6),
        room.getPositionAt(X + 5, Y + 5),
        room.getPositionAt(X + 6, Y + 4)
      ] as RoomPosition[]);
      // set tower
      level8Layout.set(STRUCTURE_TOWER, [
        room.getPositionAt(X + 2, Y + 1),
        room.getPositionAt(X, Y + 2),
        room.getPositionAt(X - 1, Y + 1)
      ] as RoomPosition[]);
      // set spawn
      level8Layout.set(STRUCTURE_SPAWN, [room.getPositionAt(X - 2, Y + 2)] as RoomPosition[]);
      // set nuker
      level8Layout.set(STRUCTURE_NUKER, [room.getPositionAt(X - 3, Y)] as RoomPosition[]);
      // set observer
      level8Layout.set(STRUCTURE_OBSERVER, [room.getPositionAt(X + 3, Y)] as RoomPosition[]);
      // set powerspawn
      level8Layout.set(STRUCTURE_POWER_SPAWN, [room.getPositionAt(X, Y + 3)] as RoomPosition[]);
      // set tower
      level8Layout.set(STRUCTURE_TOWER, [
        room.getPositionAt(X, Y + 2),
        room.getPositionAt(X - 2, Y + 1),
        room.getPositionAt(X + 2, Y + 1)
      ] as RoomPosition[]);
      // set lab
      level8Layout.set(STRUCTURE_LAB, [
        room.getPositionAt(X + 1, Y - 4),
        room.getPositionAt(X + 1, Y - 5),
        room.getPositionAt(X + 2, Y - 2),
        room.getPositionAt(X + 2, Y - 3),
        room.getPositionAt(X + 2, Y - 5),
        room.getPositionAt(X + 3, Y - 2),
        room.getPositionAt(X + 3, Y - 4),
        room.getPositionAt(X + 3, Y - 5),
        room.getPositionAt(X + 4, Y - 3),
        room.getPositionAt(X + 4, Y - 4)
      ] as RoomPosition[]);

      layout.push(level8Layout);
    }

    return true;
  };
  const createConstructionSiteByLevel = (level: number) => {
    if (level > 8 || level < 1) return;
    const map = context.getLayout()[level - 1];
    for (const [key, value] of map) {
      for (const position of value) {
        context.addConstructTask({
          pos: position,
          type: key,
          postTime: 0
        });
      }
    }
  };
  const getContainerPos = (): RoomPosition[] => {
    const room = context.getRoom();
    const layout = context.getLayout();
    if (layout.length < 8) return [];
    const pos: RoomPosition[] = [];
    const level1Layout = layout[0];
    const level1Container = level1Layout.get(STRUCTURE_CONTAINER);
    if (!isUndefined(level1Container)) for (const container of level1Container!) pos.push(container);
    const level6Layout = layout[5];
    const level6Container = level6Layout.get(STRUCTURE_CONTAINER);
    if (!isUndefined(level6Container)) for (const container of level6Container!) pos.push(container);
    return pos;
  };
  return { createLayout, createConstructionSiteByLevel, getContainerPos };
}
