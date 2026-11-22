// The world: loads a level into live state, steps every system in order, and
// owns loot pickup, the exit, and the win/busted events the screens listen for.
import { LEVELS } from './levels.js';
import { STEP, TIME_BONUS_PER_SEC, ALARM_PENALTY_PER_POINT } from './config.js';
import { dist } from './geo.js';
import { createThief, updateThief } from './thief.js';
import { createGuard, updateGuards } from './guards.js';
import { createCamera, updateCameras } from './cameras.js';
import { createLaser, updateLasers } from './lasers.js';
import { decayAlarm } from './alarm.js';
import { updateTools } from './tools.js';

export const EVENT_NONE = 0;
export const EVENT_PICKUP = 1;
export const EVENT_TARGET = 2;
export const EVENT_CLEAR = 4;
export const EVENT_BUSTED = 8;
export const EVENT_WIN = 16;

export function createWorld(random, audio) {
  const world = {
    random,
    audio,
    state: null,
    totalLoot: 0,
    totalCosts: 0,
    totalTime: 0,
  };
  world.loadLevel = (index) => loadLevel(world, index);
  return world;
}

function loadLevel(world, index) {
  const level = LEVELS[index];
  const doors = level.doors.map((d) => ({ ...d, open: false }));
  // Locked doors are solids themselves (the same objects), so opening one
  // removes exactly its solid from the list.
  const solids = [...level.walls, ...level.columns, ...level.cases, ...doors.filter((d) => !d.open)];
  const lowSolids = level.ropes.map((r) => {
    const horizontal = Math.abs(r.y2 - r.y1) < Math.abs(r.x2 - r.x1);
    if (horizontal) return { x: Math.min(r.x1, r.x2), y: r.y1 - 4, w: Math.abs(r.x2 - r.x1), h: 8 };
    return { x: r.x1 - 4, y: Math.min(r.y1, r.y2), w: 8, h: Math.abs(r.y2 - r.y1) };
  });
  world.state = {
    levelIndex: index,
    level,
    audio: world.audio,
    time: 0,
    alarm: 0,
    lootValue: 0,
    toolCosts: 0,
    tools: { smoke: 2, emp: 1 },
    thief: createThief(level.start),
    guards: level.guards.map(createGuard),
    cameras: level.cameras.map(createCamera),
    lasers: level.lasers.map(createLaser),
    loot: level.loot.map((l) => ({ ...l, taken: false })),
    doors,
    exit: { ...level.exit, open: false },
    solids,
    lowSolids,
    smokes: [],
    message: level.intro,
    messageT: 3.5,
    bustedReason: '',
    cameraWarned: false,
    pickable: null,
    clearStats: null,
    alarmTickT: 0,
  };
  return world.state;
}

// One fixed step. Returns an event bitmask for the screens.
export function stepWorld(world, input, dt) {
  const state = world.state;
  if (!state) return EVENT_NONE;
  state.time += dt;
  let events = EVENT_NONE;

  updateThief(state, dt, input);
  updateGuards(state, dt);
  updateCameras(state, dt);
  updateLasers(state, dt);
  updateTools(state, dt);
  decayAlarm(state, dt);

  // Alarm heartbeat: a ticking warning while the meter runs hot.
  if (state.alarm >= 75) {
    state.alarmTickT -= dt;
    if (state.alarmTickT <= 0) {
      state.alarmTickT = 0.7;
      state.audio.alarmTick();
    }
  }

  if (state.messageT > 0) state.messageT -= dt;

  // Loot pickup: walk over an unlocked piece to pocket it. Gems sit inside
  // glass cases, so they are grabbed by reaching over the case's edge.
  const thief = state.thief;
  for (const loot of state.loot) {
    if (loot.taken || loot.locked) continue;
    const grabR = loot.kind === 'gem' ? thief.r + 52 : thief.r + 22;
    if (dist(thief.x, thief.y, loot.x, loot.y) < grabR) {
      loot.taken = true;
      state.lootValue += loot.value;
      if (loot.target) {
        state.exit.open = true;
        state.message = `${loot.name} secured! Get to the EXIT!`;
        state.audio.target();
        events |= EVENT_TARGET;
      } else {
        state.message = `Pocketed ${loot.name} (+$${loot.value}).`;
        state.audio.pickup();
        events |= EVENT_PICKUP;
      }
      state.messageT = 2.5;
    }
  }

  // The exit only opens once the level's target loot is taken.
  const exit = state.exit;
  if (
    exit.open &&
    thief.x + thief.r > exit.x - 4 &&
    thief.x - thief.r < exit.x + exit.w + 4 &&
    thief.y >= exit.y &&
    thief.y <= exit.y + exit.h
  ) {
    const timeBonus = Math.max(0, Math.round((state.level.par - state.time) * TIME_BONUS_PER_SEC));
    const alarmPenalty = Math.round(state.alarm * ALARM_PENALTY_PER_POINT);
    const payout = Math.max(0, state.lootValue - state.toolCosts + timeBonus - alarmPenalty);
    state.clearStats = {
      loot: state.lootValue,
      tools: state.toolCosts,
      timeBonus,
      alarmPenalty,
      payout,
      time: state.time,
    };
    world.totalLoot += state.lootValue;
    world.totalCosts += state.toolCosts;
    world.totalTime += state.time;
    state.audio.clear();
    events |= EVENT_CLEAR;
    if (state.levelIndex + 1 >= LEVELS.length) events |= EVENT_WIN;
  }

  if (state.alarm >= 100) {
    state.audio.busted();
    events |= EVENT_BUSTED;
  }
  return events;
}

export { STEP };
