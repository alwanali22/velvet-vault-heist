// Keyboard and mouse input: WASD/arrows to move, Shift to sneak, E to pick locks,
// 1 smoke, 2 EMP, Space/Enter to confirm, P or Escape to pause, M to mute.
// A mouse click sets a move target the thief walks toward.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SMOKE = 4;
export const ACTION_EMP = 8;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let moveTarget = null;
  let interactHeld = false;

  function keyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if (e.repeat) return;
    keys.add(e.key.toLowerCase());
    if (e.key === ' ' || e.key === 'Enter') actions |= ACTION_CONFIRM;
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') actions |= ACTION_PAUSE;
    if (e.key === '1') actions |= ACTION_SMOKE;
    if (e.key === '2') actions |= ACTION_EMP;
    if (e.key === 'e' || e.key === 'E') interactHeld = true;
  }

  function keyUp(e) {
    keys.delete(e.key.toLowerCase());
    if (e.key === 'e' || e.key === 'E') interactHeld = false;
  }

  function pointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    moveTarget = { x, y };
    actions |= ACTION_CONFIRM;
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  canvas.addEventListener('pointerdown', pointerDown);

  return {
    // A unit movement vector from the keys, or null when no key is held.
    direction() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      if (x === 0 && y === 0) return null;
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
    sneaking() {
      return keys.has('shift');
    },
    running() {
      return keys.has('r') || keys.has('R');
    },
    interactHeld() {
      return interactHeld;
    },
    takeMoveTarget() {
      const t = moveTarget;
      moveTarget = null;
      return t;
    },
    takeActions() {
      const a = actions;
      actions = 0;
      return a;
    },
  };
}
