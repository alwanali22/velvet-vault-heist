// Tools, each charged against the level payout — tools cost loot, so using one
// is a real decision, not a free win.
//   1 Smoke bomb: a cloud that blinds every cone it covers for SMOKE_DURATION.
//   2 EMP burst: shuts every camera down for EMP_DURATION.
//   E Lockpick: hold near a locked case or vault door (see thief.js).
import { TOOL_SMOKE_COST, TOOL_EMP_COST, SMOKE_DURATION, SMOKE_RADIUS } from './config.js';
import { empBurst } from './cameras.js';

export function useSmoke(state) {
  if (state.tools.smoke <= 0) {
    state.message = 'No smoke bombs left.';
    state.messageT = 1.5;
    return false;
  }
  state.tools.smoke -= 1;
  state.toolCosts += TOOL_SMOKE_COST;
  state.smokes.push({ x: state.thief.x, y: state.thief.y, r: SMOKE_RADIUS, t: SMOKE_DURATION });
  state.message = `Smoke out! (-$${TOOL_SMOKE_COST})`;
  state.messageT = 2;
  state.audio.smoke();
  return true;
}

export function useEmp(state) {
  if (state.tools.emp <= 0) {
    state.message = 'No EMP charges left.';
    state.messageT = 1.5;
    return false;
  }
  state.tools.emp -= 1;
  state.toolCosts += TOOL_EMP_COST;
  empBurst(state);
  state.message = `Cameras dark for a while. (-$${TOOL_EMP_COST})`;
  state.messageT = 2;
  state.audio.emp();
  return true;
}

export function updateTools(state, dt) {
  for (const s of state.smokes) s.t -= dt;
  state.smokes = state.smokes.filter((s) => s.t > 0);
}
