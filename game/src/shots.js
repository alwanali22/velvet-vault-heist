// Staged scenes for screenshots: each one sets the world to a fixed, readable
// moment and paints it, so the screenshots are real renders of the game's own
// code. ?shot=cover|smoke|vault|caught (with &seed=N) stages that scene instead
// of running the loop, paints it twice and sets window.__shotReady.
import { SCREEN_PLAY, SCREEN_BUSTED } from './render.js';

function setGuard(guard, x, y, angle, state, seen) {
  guard.x = x;
  guard.y = y;
  guard.angle = angle;
  guard.state = state;
  guard.seen = seen;
  guard.lastSeenT = 0;
}

export function stageShot(name, world) {
  const state = world.state;
  if (name === 'cover') {
    world.loadLevel(1);
    const s = world.state;
    s.time = 62;
    s.alarm = 35;
    s.lootValue = 1850;
    s.loot.find((l) => l.id === 'tiara').taken = true;
    s.thief.x = 640;
    s.thief.y = 420;
    s.thief.facing = -Math.PI / 2;
    s.thief.sneaking = true;
    setGuard(s.guards[0], 520, 360, 0, 'patrol', 0);
    setGuard(s.guards[1], 700, 160, Math.PI / 2, 'patrol', 0.55);
    setGuard(s.guards[2], 860, 580, Math.PI, 'investigate', 0.2);
    s.guards[2].tx = 640;
    s.guards[2].ty = 420;
    s.cameras[0].phase = 0.9;
    s.cameras[1].phase = -0.6;
    s.cameras[2].phase = 0.4;
    s.message = 'The Scepter is behind the vault door — pick it.';
    s.messageT = 10;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'smoke') {
    world.loadLevel(1);
    const s = world.state;
    s.time = 96;
    s.alarm = 48;
    s.lootValue = 2400;
    s.loot.find((l) => l.id === 'tiara').taken = true;
    s.tools.smoke = 1;
    s.toolCosts = 150;
    s.thief.x = 470;
    s.thief.y = 160;
    s.thief.facing = Math.PI;
    s.thief.sneaking = true;
    s.smokes.push({ x: 470, y: 160, r: 95, t: 4.2 });
    setGuard(s.guards[1], 560, 160, Math.PI, 'investigate', 0.3);
    s.guards[1].tx = 470;
    s.guards[1].ty = 160;
    setGuard(s.guards[0], 500, 360, -Math.PI / 2, 'patrol', 0);
    s.cameras[0].phase = 1.2;
    s.message = 'Smoke out! The cones cannot see through it.';
    s.messageT = 10;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'vault') {
    world.loadLevel(2);
    const s = world.state;
    s.time = 148;
    s.alarm = 55;
    s.lootValue = 6100;
    for (const id of ['parure', 'idol', 'crown']) s.loot.find((l) => l.id === id).taken = true;
    s.doors[0].open = true;
    s.solids = s.solids.filter((r) => r.x !== 620 || r.y !== 480);
    s.thief.x = 640;
    s.thief.y = 392;
    s.thief.facing = -Math.PI / 2;
    setGuard(s.guards[3], 700, 540, -Math.PI / 2, 'chase', 1);
    setGuard(s.guards[0], 420, 180, 0, 'patrol', 0);
    s.cameras[0].phase = 0.5;
    s.cameras[3].phase = -0.8;
    s.message = 'The Star Sapphire is right there — grab it and run!';
    s.messageT = 10;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'caught') {
    world.loadLevel(0);
    const s = world.state;
    s.time = 74;
    s.alarm = 100;
    s.lootValue = 900;
    s.loot.find((l) => l.id === 'fan').taken = true;
    s.thief.x = 640;
    s.thief.y = 430;
    s.thief.facing = Math.PI;
    setGuard(s.guards[0], 668, 430, Math.PI, 'chase', 1);
    setGuard(s.guards[1], 1080, 300, -Math.PI / 2, 'patrol', 0.4);
    s.bustedReason = 'A guard grabbed you in the open.';
    s.message = '';
    s.messageT = 0;
    return { screen: SCREEN_BUSTED, best: 0 };
  }
  return { screen: SCREEN_PLAY, best: 0 };
}
