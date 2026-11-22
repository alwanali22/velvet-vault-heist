// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps, and the renderer paints what is there. The game moves between six
// screens: title, play, paused, room clear, busted and the final getaway.
//
// ?seed=N fixes the random stream. ?shot=cover|smoke|vault|caught (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, stepWorld, EVENT_CLEAR, EVENT_BUSTED, EVENT_WIN } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_SMOKE, ACTION_EMP, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_CLEAR, SCREEN_BUSTED, SCREEN_WIN } from './render.js';
import { useSmoke, useEmp } from './tools.js';
import { stageShot } from './shots.js';

const BEST_KEY = 'velvet-vault-best';
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const audio = createAudio();
const world = createWorld(createRandom(seed), audio);
world.loadLevel(0);
// A handle for automated play-testing; the game never reads it itself.
window.__velvet = world;
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const staged = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, staged.screen, staged.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startLevel(index) {
    world.loadLevel(index);
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Room ${index + 1}. ${world.state.level.intro}`);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_SMOKE && screen === SCREEN_PLAY) useSmoke(world.state);
    if (actions & ACTION_EMP && screen === SCREEN_PLAY) useEmp(world.state);
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      if (screen === SCREEN_TITLE) startLevel(0);
      else if (screen === SCREEN_CLEAR) startLevel(world.state.levelIndex + 1);
      else if (screen === SCREEN_BUSTED) startLevel(world.state.levelIndex);
      else if (screen === SCREEN_WIN) startLevel(0);
      else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
  }

  function step() {
    if (screen !== SCREEN_PLAY) return;
    const events = stepWorld(world, input, STEP);
    if (events & EVENT_BUSTED) {
      screen = SCREEN_BUSTED;
      announce(`Busted. ${world.state.bustedReason}`);
    } else if (events & EVENT_CLEAR) {
      const payout = world.state.clearStats.payout;
      const total = world.totalLoot - world.totalCosts;
      if (events & EVENT_WIN) {
        screen = SCREEN_WIN;
        if (payout > best) {
          best = payout;
          saveBest(best);
        }
        announce(`Clean getaway! Payout $${payout}.`);
      } else {
        screen = SCREEN_CLEAR;
        announce(`Room clear. Payout $${payout}. Total so far $${total}.`);
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        step();
        accumulator -= STEP;
        if (screen !== SCREEN_PLAY) {
          accumulator = 0;
          break;
        }
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // M toggles mute; leaving the tab pauses a running heist.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
      const muted = audio.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Velvet Vault. Press Space or click to begin the heist.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
