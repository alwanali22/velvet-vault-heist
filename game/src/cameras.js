// Security cameras: fixed to the wall, sweeping a cone back and forth. A camera
// that sees the thief raises the alarm fast; an EMP shuts every camera down for
// a few seconds, and smoke blinds a camera whose view crosses the cloud.
import { CAMERA_RANGE, CAMERA_HALF, CAMERA_ALARM_RATE, EMP_DURATION } from './config.js';
import { dist, angleTo, angleDiff, lineOfSightClear } from './geo.js';

export function createCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    speed: def.speed,
    angle: def.baseAngle,
    phase: 0,
    disabledT: 0,
    spotting: false,
  };
}

export function updateCameras(state, dt) {
  for (const cam of state.cameras) {
    if (cam.disabledT > 0) {
      cam.disabledT -= dt;
      cam.spotting = false;
      continue;
    }
    cam.phase += cam.speed * dt;
    cam.angle = cam.baseAngle + Math.sin(cam.phase) * cam.sweep;

    const thief = state.thief;
    const d = dist(cam.x, cam.y, thief.x, thief.y);
    let sees = false;
    if (d < CAMERA_RANGE) {
      const inCone = Math.abs(angleDiff(angleTo(cam.x, cam.y, thief.x, thief.y), cam.angle)) < CAMERA_HALF;
      if (inCone && lineOfSightClear(cam.x, cam.y, thief.x, thief.y, state.solids)) {
        sees = true;
        for (const s of state.smokes) {
          if (dist(thief.x, thief.y, s.x, s.y) < s.r) sees = false;
        }
      }
    }
    cam.spotting = sees;
    if (sees) {
      state.alarm = Math.min(100, state.alarm + CAMERA_ALARM_RATE * dt);
      if (!state.cameraWarned) {
        state.cameraWarned = true;
        state.message = 'Camera on you — break the cone!';
        state.messageT = 2;
        state.audio.alert();
      }
    } else if (state.cameraWarned && !state.cameras.some((c) => c.spotting)) {
      state.cameraWarned = false;
    }
  }
}

// EMP burst: every camera goes dark for EMP_DURATION seconds.
export function empBurst(state) {
  for (const cam of state.cameras) cam.disabledT = EMP_DURATION;
}
