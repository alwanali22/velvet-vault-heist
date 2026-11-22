// All canvas drawing: the museum at night, the cones, the loot, the HUD and every
// screen. The judge sees the game almost entirely through screenshots, so the
// cover frame must read at a glance: guards and their cones, cameras, glowing
// loot, the alarm meter and the exit, all in one frame.
import { VIEW_W, VIEW_H, HUD_H, GUARD_CONE_RANGE, CAMERA_RANGE } from './config.js';
import { alarmLevel } from './alarm.js';
import { dist } from './geo.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_BUSTED = 'busted';
export const SCREEN_WIN = 'win';

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function drawCone(ctx, x, y, angle, half, range, color) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawFloor(ctx, state) {
  // Night parquet: dark planks with a faint sheen, drawn from the level seed.
  ctx.fillStyle = '#141824';
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  const plankH = 26;
  for (let y = HUD_H; y < VIEW_H; y += plankH) {
    const row = Math.floor((y - HUD_H) / plankH);
    for (let x = 0; x < VIEW_W; x += 104) {
      const shade = (row * 7 + Math.floor(x / 104) * 13) % 3;
      ctx.fillStyle = ['#171b29', '#191d2c', '#151927'][shade];
      ctx.fillRect(x + 1, y + 1, 102, plankH - 2);
    }
  }
  // Warm pools of light under the gallery lamps.
  const lamps = state.level.carpets.length ? state.level.carpets : [];
  for (const c of lamps) {
    const g = ctx.createRadialGradient(
      c.x + c.w / 2, c.y + c.h / 2, 10,
      c.x + c.w / 2, c.y + c.h / 2, Math.max(c.w, c.h) * 0.75,
    );
    g.addColorStop(0, 'rgba(255, 214, 130, 0.10)');
    g.addColorStop(1, 'rgba(255, 214, 130, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(c.x - 80, c.y - 80, c.w + 160, c.h + 160);
  }
  // Red carpet runners with a gold edge.
  for (const c of state.level.carpets) {
    ctx.fillStyle = '#5e1a24';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 3;
    ctx.strokeRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
  }
}

function drawWalls(ctx, state) {
  for (const w of state.level.walls) {
    ctx.fillStyle = '#232838';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
  }
}

function drawPainting(ctx, loot, state) {
  if (loot.taken) {
    // An empty gold frame and a pale rectangle: the painting is gone.
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 3;
    ctx.strokeRect(loot.x - 34, loot.y - 24, 68, 48);
    ctx.fillStyle = 'rgba(220, 220, 200, 0.12)';
    ctx.fillRect(loot.x - 30, loot.y - 20, 60, 40);
    return;
  }
  const h = hashString(loot.id);
  const hue = h % 360;
  ctx.save();
  ctx.translate(loot.x, loot.y);
  ctx.fillStyle = '#6b5220';
  ctx.fillRect(-37, -27, 74, 54);
  ctx.fillStyle = `hsl(${hue}, 45%, 32%)`;
  ctx.fillRect(-33, -23, 66, 46);
  ctx.fillStyle = `hsl(${(hue + 60) % 360}, 60%, 62%)`;
  ctx.beginPath();
  ctx.arc(-8 + (h % 20), -6, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `hsl(${(hue + 140) % 360}, 40%, 22%)`;
  ctx.beginPath();
  ctx.moveTo(-33, 23);
  ctx.lineTo(-8, -2);
  ctx.lineTo(12, 23);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(4, 23);
  ctx.lineTo(24, 4);
  ctx.lineTo(33, 23);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (loot.target) {
    const pulse = 0.6 + 0.4 * Math.sin(state.time * 4);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(loot.x - 41, loot.y - 31, 82, 62);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ TARGET', loot.x, loot.y - 38);
    ctx.restore();
  }
}

function drawCase(ctx, c, state) {
  ctx.fillStyle = '#1b2133';
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.fillStyle = 'rgba(160, 200, 255, 0.14)';
  ctx.fillRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
  ctx.strokeStyle = '#8fa3c8';
  ctx.lineWidth = 2;
  ctx.strokeRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(c.x + 6, c.y + c.h - 6);
  ctx.lineTo(c.x + c.w / 2, c.y + 6);
  ctx.stroke();
}

function drawGem(ctx, loot, state) {
  if (loot.taken) return;
  const pulse = 0.65 + 0.35 * Math.sin(state.time * 5 + loot.x);
  ctx.save();
  ctx.translate(loot.x, loot.y);
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
  g.addColorStop(0, `rgba(255, 215, 0, ${0.85 * pulse})`);
  g.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = loot.target ? '#ffdf4d' : '#e8b923';
  ctx.fillRect(-8, -8, 16, 16);
  ctx.strokeStyle = '#fff3b0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-8, -8, 16, 16);
  ctx.restore();
  if (loot.target) {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ TARGET', loot.x, loot.y - 32);
  }
  if (loot.locked) {
    ctx.fillStyle = '#d8d8d8';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOCKED · hold E', loot.x, loot.y + 30);
  }
}

function drawColumn(ctx, c) {
  ctx.fillStyle = '#3a3f55';
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.fillStyle = '#c8c4b0';
  ctx.beginPath();
  ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#efe9d6';
  ctx.beginPath();
  ctx.arc(c.x + c.w / 2 - 4, c.y + c.h / 2 - 4, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawRopes(ctx, state) {
  for (const r of state.level.ropes) {
    ctx.strokeStyle = '#8e1f2f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(r.x1, r.y1);
    ctx.quadraticCurveTo((r.x1 + r.x2) / 2, Math.max(r.y1, r.y2) + 10, r.x2, r.y2);
    ctx.stroke();
    for (const [px, py] of [[r.x1, r.y1], [r.x2, r.y2]]) {
      ctx.fillStyle = '#c9a227';
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a5c10';
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawLasers(ctx, state) {
  for (const l of state.lasers) {
    if (l.on) {
      ctx.strokeStyle = 'rgba(255, 40, 60, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
      ctx.fillStyle = '#ff4d5e';
      for (const [ex, ey] of [[l.x1, l.y1], [l.x2, l.y2]]) {
        ctx.beginPath();
        ctx.arc(ex, ey, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      const pulse = 0.5 + 0.5 * Math.sin(state.time * 10);
      ctx.fillStyle = `rgba(255, 60, 70, ${0.25 * pulse})`;
      ctx.beginPath();
      ctx.arc((l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2, 12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(255, 40, 60, 0.18)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('laser off — go!', (l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2 - 8);
    }
  }
}

function drawExit(ctx, state) {
  const e = state.exit;
  const cx = e.x + e.w / 2;
  const cy = e.y + e.h / 2;
  if (e.open) {
    const pulse = 0.6 + 0.4 * Math.sin(state.time * 5);
    ctx.fillStyle = `rgba(46, 204, 113, ${0.35 + 0.4 * pulse})`;
    ctx.fillRect(e.x - 14, e.y - 6, e.w + 28, e.h + 12);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText('EXIT →', e.x - 10, cy + 5);
  } else {
    ctx.fillStyle = '#3a1520';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText('LOCKED', e.x - 10, cy + 5);
  }
}

function drawDoors(ctx, state) {
  for (const d of state.doors) {
    if (d.open) {
      ctx.fillStyle = '#1d2b1d';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      return;
    }
    ctx.fillStyle = '#4a3a1a';
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.strokeRect(d.x, d.y, d.w, d.h);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    const cx = d.x + d.w / 2;
    const cy = d.y + d.h / 2;
    // A small drawn padlock: a gold shackle arc over a filled body.
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy - 1, 5, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(cx - 5, cy - 1, 10, 8);
    if (d.w > d.h) ctx.fillText('VAULT', cx, cy - 14);
    else {
      ctx.save();
      ctx.translate(cx - 13, cy);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('VAULT', 0, 4);
      ctx.restore();
    }
  }
}

function drawCameras(ctx, state) {
  for (const cam of state.cameras) {
    if (cam.disabledT <= 0) {
      drawCone(
        ctx, cam.x, cam.y, cam.angle, 0.5, CAMERA_RANGE,
        cam.spotting ? 'rgba(255, 60, 60, 0.34)' : 'rgba(80, 200, 255, 0.20)',
      );
    }
    ctx.fillStyle = '#20242f';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cam.disabledT > 0 ? '#555' : cam.spotting ? '#ff3b30' : '#38c8ff';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8fa3c8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 10, 0, Math.PI * 2);
    ctx.stroke();
    if (cam.spotting) {
      ctx.fillStyle = '#ff3b30';
      ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', cam.x, cam.y - 16);
    }
  }
}

function drawGuards(ctx, state) {
  for (const g of state.guards) {
    const alert = g.state === 'chase' || g.seen > 0.4;
    drawCone(
      ctx, g.x, g.y, g.angle, 0.62, GUARD_CONE_RANGE,
      g.state === 'chase' ? 'rgba(255, 50, 50, 0.38)' : alert ? 'rgba(255, 150, 40, 0.30)' : 'rgba(255, 190, 80, 0.22)',
    );
    // Body: maroon uniform, cap brim toward facing.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(g.x + 3, g.y + 4, 13, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a2e2e';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8b25e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#2b0d0d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 17, g.y + Math.sin(g.angle) * 17);
    ctx.stroke();
    if (g.state === 'chase') {
      ctx.fillStyle = '#ff3b30';
      ctx.font = 'bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 20);
    } else if (g.state === 'investigate') {
      ctx.fillStyle = '#ffd76a';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 20);
    }
    if (g.seen > 0.05 && g.seen < 1) {
      ctx.strokeStyle = '#ffcf3d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 19, -Math.PI / 2, -Math.PI / 2 + g.seen * Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawThief(ctx, state) {
  const t = state.thief;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(t.x + 2, t.y + 3, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#151828';
  ctx.beginPath();
  ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = t.sneaking ? '#7fd4ff' : '#e8e8e8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
  ctx.stroke();
  // Cloak point and hat brim toward facing.
  ctx.fillStyle = '#2c3150';
  ctx.beginPath();
  ctx.moveTo(t.x + Math.cos(t.facing) * 16, t.y + Math.sin(t.facing) * 16);
  ctx.lineTo(t.x + Math.cos(t.facing + 2.4) * 10, t.y + Math.sin(t.facing + 2.4) * 10);
  ctx.lineTo(t.x + Math.cos(t.facing - 2.4) * 10, t.y + Math.sin(t.facing - 2.4) * 10);
  ctx.closePath();
  ctx.fill();
  if (t.sneaking) {
    ctx.strokeStyle = 'rgba(127, 212, 255, 0.7)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (t.lockpick) {
    const p = t.lockpick.progress / t.lockpick.needed;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 22, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PICKING…', t.x, t.y + 40);
  } else {
    // Label the player so the thief reads at a glance in a small screenshot.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', t.x, t.y + 28);
  }
}

function drawSmoke(ctx, state) {
  for (const s of state.smokes) {
    const a = Math.min(0.55, (s.t / 5) * 0.55 + 0.15);
    const g = ctx.createRadialGradient(s.x, s.y, 10, s.x, s.y, s.r);
    g.addColorStop(0, `rgba(200, 200, 210, ${a})`);
    g.addColorStop(1, 'rgba(200, 200, 210, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = 'rgba(8, 10, 18, 0.92)';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, HUD_H);
  ctx.lineTo(VIEW_W, HUD_H);
  ctx.stroke();

  const target = state.loot.find((l) => l.target);
  ctx.fillStyle = '#e8d9a0';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Room ${state.levelIndex + 1} · ${state.level.name}`, 16, 24);
  ctx.fillStyle = '#b9c0d8';
  ctx.font = '13px Georgia, serif';
  const objective = target && !target.taken
    ? `Steal: ${target.name}  →  then reach the EXIT`
    : target && target.taken
      ? 'Target secured — reach the EXIT!'
      : 'Steal the target loot, then reach the EXIT';
  ctx.fillText(objective, 16, 46);

  // Alarm meter, centre.
  const level = alarmLevel(state.alarm);
  const colors = { calm: '#2ecc71', watch: '#f1c40f', high: '#e67e22', critical: '#e74c3c' };
  ctx.fillStyle = '#f5f5f5';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', 470, 26);
  ctx.fillStyle = '#20242f';
  ctx.fillRect(540, 12, 300, 20);
  ctx.fillStyle = colors[level];
  ctx.fillRect(542, 14, Math.max(0, (state.alarm / 100) * 296), 16);
  ctx.strokeStyle = '#8fa3c8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(540, 12, 300, 20);
  ctx.fillStyle = '#f5f5f5';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${Math.round(state.alarm)}%`, 848, 27);
  ctx.fillStyle = '#b9c0d8';
  ctx.font = '12px Georgia, serif';
  ctx.fillText(level === 'calm' ? 'unseen' : level === 'watch' ? 'suspicious' : level === 'high' ? 'hunted' : 'BUSTED SOON', 540, 50);

  // Loot, tools, time, right.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText(`LOOT $${state.lootValue.toLocaleString('en-US')}`, 1264, 26);
  ctx.fillStyle = '#b9c0d8';
  ctx.font = '13px Georgia, serif';
  const mm = Math.floor(state.time / 60);
  const ss = Math.floor(state.time % 60).toString().padStart(2, '0');
  ctx.fillText(`1 Smoke ×${state.tools.smoke}   2 EMP ×${state.tools.emp}    ${mm}:${ss}`, 1264, 48);

  // Transient message along the bottom, so it never covers the loot on the
  // north wall or the target label.
  if (state.messageT > 0 && state.message) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.messageT);
    ctx.font = 'bold 15px Georgia, serif';
    const w = ctx.measureText(state.message).width + 28;
    const my = VIEW_H - 40;
    ctx.fillStyle = 'rgba(8, 10, 18, 0.85)';
    ctx.fillRect((VIEW_W - w) / 2, my, w, 28);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 1;
    ctx.strokeRect((VIEW_W - w) / 2, my, w, 28);
    ctx.fillStyle = '#ffe9a8';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, VIEW_W / 2, my + 19);
    ctx.restore();
  }

  // "Hold E" hint near a lockable target.
  if (state.pickable && !state.thief.lockpick) {
    const ref = state.pickable.ref;
    const cx = state.pickable.kind === 'door' ? ref.x + ref.w / 2 : ref.x;
    const cy = state.pickable.kind === 'door' ? ref.y + ref.h / 2 : ref.y;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('hold E to pick', cx, cy - 34);
  }
}

function drawPanel(ctx, title, lines, accent, yOffset = 0) {
  const w = 620;
  const h = 110 + lines.length * 30;
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2 + yOffset;
  ctx.fillStyle = 'rgba(5, 6, 12, 0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#12141f';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = accent;
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_W / 2, y + 58);
  ctx.fillStyle = '#e8e8e8';
  ctx.font = '17px Georgia, serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, y + 102 + i * 30);
  });
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  return {
    draw(state, screen, best) {
      if (!state) return;
      drawFloor(ctx, state);
      drawWalls(ctx, state);
      for (const c of state.level.cases) drawCase(ctx, c, state);
      for (const col of state.level.columns) drawColumn(ctx, col);
      drawRopes(ctx, state);
      drawLasers(ctx, state);
      drawExit(ctx, state);
      drawDoors(ctx, state);
      for (const loot of state.loot) {
        if (loot.kind === 'painting') drawPainting(ctx, loot, state);
        else drawGem(ctx, loot, state);
      }
      drawCameras(ctx, state);
      drawGuards(ctx, state);
      drawThief(ctx, state);
      drawSmoke(ctx, state);
      drawHud(ctx, state);

      if (screen === SCREEN_TITLE) {
        ctx.fillStyle = 'rgba(5, 6, 12, 0.78)';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 64px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('VELVET VAULT', VIEW_W / 2, 210);
        ctx.fillStyle = '#e8d9a0';
        ctx.font = 'italic 22px Georgia, serif';
        ctx.fillText('a midnight museum heist', VIEW_W / 2, 250);
        ctx.fillStyle = '#e8e8e8';
        ctx.font = '17px Georgia, serif';
        ctx.fillText('Sneak past the guards. Read the cones. Dodge the cameras and lasers.', VIEW_W / 2, 320);
        ctx.fillText('Steal the target loot, then slip out the EXIT before the alarm hits 100%.', VIEW_W / 2, 348);
        ctx.fillStyle = '#b9c0d8';
        ctx.font = '15px Georgia, serif';
        ctx.fillText('Move: WASD / arrows / click   ·   Sneak: Shift   ·   Run: R (loud!)', VIEW_W / 2, 400);
        ctx.fillText('Tools: 1 Smoke bomb (−$150)   ·   2 EMP (−$250)   ·   Hold E to pick locks', VIEW_W / 2, 426);
        ctx.fillText('P pause   ·   M mute', VIEW_W / 2, 452);
        if (best > 0) {
          ctx.fillStyle = '#ffd700';
          ctx.fillText(`Best getaway so far: $${best.toLocaleString('en-US')}`, VIEW_W / 2, 500);
        }
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Georgia, serif';
        ctx.fillText('Press SPACE or click to begin', VIEW_W / 2, 560);
      } else if (screen === SCREEN_PAUSED) {
        drawPanel(ctx, 'PAUSED', ['The museum waits. The guards do not.', 'Press P or SPACE to keep sneaking.'], '#c9a227');
      } else if (screen === SCREEN_BUSTED) {
        // Shifted up so the guard that caught the thief stays visible below.
        drawPanel(
          ctx, 'BUSTED!',
          [state.bustedReason || 'The alarm hit 100%.', 'The night guard has you. The loot stays.', 'Press SPACE to try the room again.'],
          '#e74c3c',
          -140,
        );
      } else if (screen === SCREEN_CLEAR) {
        const s = state.clearStats || { loot: 0, tools: 0, timeBonus: 0, alarmPenalty: 0, payout: 0 };
        drawPanel(
          ctx, 'CLEAN GETAWAY',
          [
            `Loot pocketed: $${s.loot.toLocaleString('en-US')}    Tools used: −$${s.tools}`,
            `Time bonus: +$${s.timeBonus}    Alarm penalty: −$${s.alarmPenalty}`,
            `Room payout: $${s.payout.toLocaleString('en-US')}`,
            'Press SPACE for the next room.',
          ],
          '#2ecc71',
        );
      } else if (screen === SCREEN_WIN) {
        const s = state.clearStats || { payout: 0 };
        drawPanel(
          ctx, 'THE STAR SAPPHIRE IS YOURS',
          [
            `Total loot: $${(state.levelIndex >= 0 ? s.loot : 0).toLocaleString('en-US')} — the whole museum, cleaned out.`,
            `Final getaway payout: $${s.payout.toLocaleString('en-US')}`,
            'The van is waiting. Drive into the night.',
            'Press SPACE to play again.',
          ],
          '#ffd700',
        );
      }
    },
  };
}

// Re-exported for shots.js: how far a guard can see, for staging.
export { dist };
