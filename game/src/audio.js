// Tiny synthesized sound effects with WebAudio: no audio files are shipped, every
// sound is a few oscillators, and M toggles mute. Created lazily on first use so
// browsers allow it after a gesture.
export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, dur, type, gain, when = 0) {
    const c = ensure();
    if (!c || muted) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    pickup() {
      tone(660, 0.12, 'sine', 0.12);
      tone(990, 0.18, 'sine', 0.1, 0.07);
    },
    target() {
      tone(523, 0.14, 'triangle', 0.14);
      tone(784, 0.14, 'triangle', 0.14, 0.1);
      tone(1046, 0.3, 'triangle', 0.14, 0.2);
    },
    alert() {
      tone(220, 0.16, 'square', 0.07);
      tone(311, 0.2, 'square', 0.07, 0.12);
    },
    alarmTick() {
      tone(880, 0.08, 'square', 0.05);
    },
    laserTrip() {
      tone(1400, 0.25, 'sawtooth', 0.08);
      tone(700, 0.3, 'sawtooth', 0.06, 0.08);
    },
    smoke() {
      tone(180, 0.4, 'sine', 0.1);
    },
    emp() {
      tone(1200, 0.1, 'square', 0.06);
      tone(300, 0.35, 'square', 0.06, 0.08);
    },
    pickTick() {
      tone(1500, 0.05, 'square', 0.05);
    },
    busted() {
      tone(196, 0.3, 'sawtooth', 0.12);
      tone(147, 0.5, 'sawtooth', 0.12, 0.22);
    },
    clear() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, i * 0.09));
    },
    exit() {
      tone(392, 0.15, 'triangle', 0.12);
      tone(523, 0.3, 'triangle', 0.12, 0.1);
    },
  };
}
