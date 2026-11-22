// The thief: movement (keys or click-to-move), sneak/run, noise, and lockpicking.
// All movement collides against the level's solids; ropes block only the thief.
import {
  THIEF_RADIUS,
  WALK_SPEED,
  SNEAK_SPEED,
  RUN_SPEED,
  NOISE_WALK,
  NOISE_SNEAK,
  NOISE_RUN,
  LOCKPICK_TIME,
} from './config.js';
import { moveCircle, dist } from './geo.js';

export function createThief(start) {
  return {
    x: start.x,
    y: start.y,
    r: THIEF_RADIUS,
    facing: 0,
    moving: false,
    sneaking: false,
    running: false,
    noiseRadius: 0,
    moveTarget: null,
    lockpick: null, // { kind: 'loot'|'door', ref, progress, needed }
  };
}

export function updateThief(state, dt, input) {
  const thief = state.thief;
  const dir = input.direction();
  const target = input.takeMoveTarget();
  if (target) thief.moveTarget = target;
  if (dir) thief.moveTarget = null;

  thief.sneaking = input.sneaking();
  thief.running = input.running() && !thief.sneaking;

  let vx = 0;
  let vy = 0;
  if (dir) {
    vx = dir.x;
    vy = dir.y;
  } else if (thief.moveTarget) {
    const d = dist(thief.x, thief.y, thief.moveTarget.x, thief.moveTarget.y);
    if (d < 8) {
      thief.moveTarget = null;
    } else {
      vx = (thief.moveTarget.x - thief.x) / d;
      vy = (thief.moveTarget.y - thief.y) / d;
    }
  }

  const speed = thief.sneaking ? SNEAK_SPEED : thief.running ? RUN_SPEED : WALK_SPEED;
  thief.moving = vx !== 0 || vy !== 0;
  thief.noiseRadius = !thief.moving
    ? 0
    : thief.sneaking
      ? NOISE_SNEAK
      : thief.running
        ? NOISE_RUN
        : NOISE_WALK;

  if (thief.moving) {
    thief.facing = Math.atan2(vy, vx);
    const solids = state.solids.concat(state.lowSolids);
    const before = { x: thief.x, y: thief.y };
    const moved = moveCircle(thief.x, thief.y, thief.r, vx * speed * dt, vy * speed * dt, solids);
    thief.x = moved.x;
    thief.y = moved.y;
    // Click-to-move gives up when the thief is wedged against something: the
    // target is unreachable from here, so stop pushing into the wall.
    if (thief.moveTarget) {
      const gained = dist(before.x, before.y, thief.x, thief.y);
      thief.stuckT = gained < 0.5 ? (thief.stuckT ?? 0) + dt : 0;
      if (thief.stuckT > 0.6) {
        thief.moveTarget = null;
        thief.stuckT = 0;
      }
    }
  }

  updateLockpick(state, dt, input);
}

function nearestPickable(state) {
  const thief = state.thief;
  let best = null;
  let bestD = 46;
  for (const loot of state.loot) {
    if (loot.taken || !loot.locked) continue;
    const d = dist(thief.x, thief.y, loot.x, loot.y);
    if (d < bestD) {
      bestD = d;
      best = { kind: 'loot', ref: loot };
    }
  }
  for (const door of state.doors) {
    if (door.open) continue;
    const cx = door.x + door.w / 2;
    const cy = door.y + door.h / 2;
    const d = dist(thief.x, thief.y, cx, cy);
    if (d < bestD + 14) {
      bestD = d;
      best = { kind: 'door', ref: door };
    }
  }
  return best;
}

function updateLockpick(state, dt, input) {
  const thief = state.thief;
  const pickable = nearestPickable(state);
  state.pickable = pickable;
  if (!input.interactHeld() || !pickable) {
    if (thief.lockpick) state.audio.pickTick();
    thief.lockpick = null;
    return;
  }
  if (!thief.lockpick || thief.lockpick.ref !== pickable.ref) {
    thief.lockpick = {
      kind: pickable.kind,
      ref: pickable.ref,
      progress: 0,
      needed: pickable.kind === 'door' ? pickable.ref.lockTime : LOCKPICK_TIME,
    };
  }
  thief.lockpick.progress += dt;
  if (Math.floor(thief.lockpick.progress * 4) !== Math.floor((thief.lockpick.progress - dt) * 4)) {
    state.audio.pickTick();
  }
  if (thief.lockpick.progress >= thief.lockpick.needed) {
    if (pickable.kind === 'door') {
      pickable.ref.open = true;
      state.solids = state.solids.filter((s) => s !== pickable.ref);
      state.message = `${pickable.ref.name} open — slip through.`;
      state.audio.exit();
    } else {
      pickable.ref.locked = false;
      state.message = `${pickable.ref.name} case picked — grab it.`;
      state.audio.pickup();
    }
    state.messageT = 2.5;
    thief.lockpick = null;
  }
}
