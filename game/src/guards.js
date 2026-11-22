// Guards: patrol waypoints, see through a vision cone, hear running feet, give
// chase when they spot the thief, and give up after losing sight for a while.
// A guard's "seen" meter fills while the thief is in its cone and line of sight;
// while any guard sees the thief, the alarm climbs.
import {
  GUARD_SPEED,
  GUARD_CHASE_SPEED,
  GUARD_CONE_RANGE,
  GUARD_CONE_HALF,
  GUARD_SEEN_RATE,
  GUARD_SEEN_DECAY,
  GUARD_HEAR_RADIUS,
  GUARD_GIVE_UP,
  GUARD_CATCH_RADIUS,
  ALARM_GUARD_RATE,
  ALARM_CATCH_TOUCH,
  GUARD_TOUCH_COOLDOWN,
} from './config.js';
import { dist, angleTo, angleDiff, lineOfSightClear, moveCircle } from './geo.js';

export function createGuard(def) {
  const [sx, sy] = def.waypoints[0];
  return {
    x: sx,
    y: sy,
    angle: def.waypoints.length > 1 ? angleTo(sx, sy, def.waypoints[1][0], def.waypoints[1][1]) : 0,
    wpIndex: 1 % def.waypoints.length,
    wait: def.wait ?? 0.9,
    waitT: 0,
    state: 'patrol', // patrol | investigate | chase
    seen: 0,
    lastSeenT: 0,
    coolT: 0, // after a grab, the guard pauses and cannot chase for a while
    tx: sx,
    ty: sy,
    alerted: false,
  };
}

// Is the thief visible to this guard right now? Range, cone, line of sight, and
// smoke clouds all count; a sneaking thief is harder to spot at distance.
export function guardSeesThief(state, guard) {
  const thief = state.thief;
  const d = dist(guard.x, guard.y, thief.x, thief.y);
  const range = thief.sneaking ? GUARD_CONE_RANGE * 0.75 : GUARD_CONE_RANGE;
  if (d > range) return false;
  if (Math.abs(angleDiff(angleTo(guard.x, guard.y, thief.x, thief.y), guard.angle)) > GUARD_CONE_HALF) return false;
  if (!lineOfSightClear(guard.x, guard.y, thief.x, thief.y, state.solids)) return false;
  for (const s of state.smokes) {
    if (dist(thief.x, thief.y, s.x, s.y) < s.r) return false;
  }
  return true;
}

export function updateGuards(state, dt) {
  const thief = state.thief;
  for (const guard of state.guards) {
    if (guard.coolT > 0) guard.coolT -= dt;
    const sees = guard.coolT > 0 ? false : guardSeesThief(state, guard);
    if (sees) {
      guard.seen = Math.min(1, guard.seen + GUARD_SEEN_RATE * dt);
      guard.lastSeenT = 0;
      if (guard.seen >= 1 && guard.state !== 'chase') {
        guard.state = 'chase';
        state.audio.alert();
        state.message = 'Spotted! Break line of sight!';
        state.messageT = 2;
      }
    } else {
      guard.seen = Math.max(0, guard.seen - GUARD_SEEN_DECAY * dt);
      guard.lastSeenT += dt;
    }

    // Hearing: running feet within earshot pull a patrolling guard over to look.
    if (guard.state === 'patrol' && thief.moving && thief.noiseRadius > 0) {
      const d = dist(guard.x, guard.y, thief.x, thief.y);
      if (d < Math.min(thief.noiseRadius, GUARD_HEAR_RADIUS) + 40) {
        guard.state = 'investigate';
        guard.tx = thief.x;
        guard.ty = thief.y;
      }
    }

    if (guard.state === 'chase') {
      if (guard.lastSeenT > GUARD_GIVE_UP) {
        guard.state = 'patrol';
        guard.seen = 0;
      } else {
        const a = angleTo(guard.x, guard.y, thief.x, thief.y);
        guard.angle = a;
        const moved = moveCircle(
          guard.x, guard.y, 13,
          Math.cos(a) * GUARD_CHASE_SPEED * dt,
          Math.sin(a) * GUARD_CHASE_SPEED * dt,
          state.solids,
        );
        guard.x = moved.x;
        guard.y = moved.y;
        if (dist(guard.x, guard.y, thief.x, thief.y) < GUARD_CATCH_RADIUS) {
          // A grab is a heavy alarm hit, not an instant bust: the thief slips
          // away and the guard pauses, so a chase stays winnable.
          state.alarm = Math.min(100, state.alarm + ALARM_CATCH_TOUCH);
          if (state.alarm >= 100) state.bustedReason = 'A guard grabbed you in the open.';
          state.message = 'Caught! You slipped away — run!';
          state.messageT = 2;
          state.audio.busted();
          guard.state = 'patrol';
          guard.seen = 0;
          guard.coolT = GUARD_TOUCH_COOLDOWN;
          guard.waitT = 1.2;
        }
      }
    } else if (guard.state === 'investigate') {
      const a = angleTo(guard.x, guard.y, guard.tx, guard.ty);
      guard.angle = a;
      const d = dist(guard.x, guard.y, guard.tx, guard.ty);
      if (d < 14) {
        guard.state = 'patrol';
      } else {
        const moved = moveCircle(
          guard.x, guard.y, 13,
          Math.cos(a) * GUARD_SPEED * 1.4 * dt,
          Math.sin(a) * GUARD_SPEED * 1.4 * dt,
          state.solids,
        );
        guard.x = moved.x;
        guard.y = moved.y;
      }
    } else {
      // Patrol: walk the waypoints, pausing at each one to look around.
      const def = state.level.guards[state.guards.indexOf(guard)];
      const wp = def.waypoints[guard.wpIndex];
      if (guard.waitT > 0) {
        guard.waitT -= dt;
        guard.angle += Math.sin(state.time * 1.4 + guard.x) * 0.35 * dt;
      } else {
        const a = angleTo(guard.x, guard.y, wp[0], wp[1]);
        guard.angle = a;
        const d = dist(guard.x, guard.y, wp[0], wp[1]);
        if (d < 8) {
          guard.wpIndex = (guard.wpIndex + 1) % def.waypoints.length;
          guard.waitT = def.wait ?? 0.9;
        } else {
          const moved = moveCircle(
            guard.x, guard.y, 13,
            Math.cos(a) * GUARD_SPEED * dt,
            Math.sin(a) * GUARD_SPEED * dt,
            state.solids,
          );
          guard.x = moved.x;
          guard.y = moved.y;
        }
      }
    }

    // While a guard has eyes on the thief, the alarm climbs.
    if (sees) {
      state.alarm = Math.min(100, state.alarm + ALARM_GUARD_RATE * dt);
      guard.alerted = true;
    } else {
      guard.alerted = guard.seen > 0.4;
    }
  }
}
