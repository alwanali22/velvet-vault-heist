// Laser barriers: a beam across a gap that cycles on and off. Crossing a live
// beam trips the alarm hard, so the player reads the cycle and slips through
// the gap — one of the several routes each room offers.
import { ALARM_LASER_TRIP } from './config.js';
import { pointSegmentDistance } from './geo.js';

export function createLaser(def) {
  return {
    x1: def.x1,
    y1: def.y1,
    x2: def.x2,
    y2: def.y2,
    period: def.period,
    onTime: def.onTime,
    phase: def.phase,
    t: def.phase,
    on: true,
    trippedT: 0,
  };
}

export function updateLasers(state, dt) {
  const thief = state.thief;
  for (const laser of state.lasers) {
    laser.t += dt;
    const cycle = laser.t % laser.period;
    laser.on = cycle < laser.onTime;
    if (laser.trippedT > 0) laser.trippedT -= dt;
    if (laser.on && laser.trippedT <= 0) {
      const d = pointSegmentDistance(thief.x, thief.y, laser.x1, laser.y1, laser.x2, laser.y2);
      if (d < thief.r + 3) {
        laser.trippedT = 1.2;
        state.alarm = Math.min(100, state.alarm + ALARM_LASER_TRIP);
        state.message = 'Laser tripped! Alarm rising!';
        state.messageT = 2;
        state.audio.laserTrip();
      }
    }
  }
}
