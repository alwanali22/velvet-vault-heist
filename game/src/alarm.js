// The alarm meter: 0..100, the room's shared suspicion. It climbs while a guard
// or a camera has eyes on the thief, jumps when a laser trips, and decays slowly
// while nobody sees anything. At 100 the heist is busted.
import { ALARM_DECAY } from './config.js';

export function alarmLevel(alarm) {
  if (alarm >= 75) return 'critical';
  if (alarm >= 45) return 'high';
  if (alarm >= 20) return 'watch';
  return 'calm';
}

export function decayAlarm(state, dt) {
  const anyoneSees =
    state.guards.some((g) => g.seen > 0.05) || state.cameras.some((c) => c.spotting);
  if (!anyoneSees && state.alarm > 0) {
    state.alarm = Math.max(0, state.alarm - ALARM_DECAY * dt);
  }
}
