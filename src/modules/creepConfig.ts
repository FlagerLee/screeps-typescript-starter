// harvest
const HARVEST_CREEP_ROLE = "Harvester";
const HARVEST_CREEP_PRIORITY = 8;
const HARVEST_CREEP_REPLACE_TTL = 20;
const HARVEST_CREEP_BODY: BodyPartConstant[][] = [
  [MOVE, WORK, WORK], // energy = 250
  [MOVE, WORK, WORK, WORK, WORK, WORK], // energy = 550
  [MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK] // energy = 750
];
const HARVEST_CREEP_BODY_COST: number[] = [250, 550, 750];
const enum HARVEST_CREEP_STATE {
  STATE_INIT,
  STATE_WORK,
  STATE_SUICIDE = -1 // creep will suicide after 1. pass source to spawn 2. receive suicide instruction from other creep
}

// upgrade
const UPGRADE_CREEP_ROLE = "Upgrader";
const UPGRADE_CREEP_PRIORITY = 2;
const UPGRADE_CREEP_BODY: BodyPartConstant[][] = [
  [MOVE, MOVE, WORK, CARRY, CARRY], // energy = 300
  [MOVE, MOVE, WORK, WORK, CARRY, CARRY], // energy = 400
  [MOVE, MOVE, MOVE, WORK, WORK, WORK, CARRY, CARRY], // energy = 550
  [MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY] // energy = 700
];
const UPGRADE_CREEP_BODY_COST: number[] = [300, 400, 550, 700];
const enum UPGRADE_CREEP_STATE {
  STATE_INIT,
  STATE_WORK,
  STATE_SUICIDE = -1
}
const UPGRADE_CREEP_LIMIT = [0, 5, 5, 5, 5, 5, 5, 5, 1];

// express
const EXPRESS_CREEP_ROLE = "Express";
const EXPRESS_CREEP_PRIORITY = 5;
const EXPRESS_CREEP_BODY: BodyPartConstant[][] = [
  [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY], // energy = 300
  [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY], // energy = 500
  [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY] // energy = 900
];
const EXPRESS_CREEP_BODY_COST: number[] = [300, 500, 900];
const enum EXPRESS_CREEP_STATE {
  STATE_INIT,
  STATE_IDLE,
  STATE_FETCH,
  STATE_CARRY
}

// construct
const CONSTRUCT_CREEP_ROLE = "Construct";
const CONSTRUCT_CREEP_PRIORITY = 5;
const CONSTRUCT_CREEP_BODY: BodyPartConstant[][] = [
  [MOVE, MOVE, CARRY, CARRY, WORK], // energy = 300
  [MOVE, MOVE, CARRY, CARRY, CARRY, WORK, WORK, WORK], // energy = 550
  [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK, WORK] // energy = 900
];
const CONSTRUCT_CREEP_BODY_COST: number[] = [300, 550, 900];
const enum CONSTRUCT_CREEP_STATE {
  STATE_INIT,
  STATE_IDLE,
  STATE_FETCH,
  STATE_WORK
}
const CONSTRUCT_CREEP_NUM = [0, 1, 2, 3, 4, 5, 5, 5, 5];
