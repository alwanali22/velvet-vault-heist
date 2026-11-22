// Geometry helpers shared by movement, vision cones and lasers: circles against
// rectangles, segments against rectangles, and line of sight through walls.
export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

export function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// True when the segment from (x1,y1) to (x2,y2) touches the rectangle.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  if (maxX < r.x || minX > r.x + r.w || maxY < r.y || minY > r.y + r.h) return false;
  if (x1 >= r.x && x1 <= r.x + r.w && y1 >= r.y && y1 <= r.y + r.h) return true;
  if (x2 >= r.x && x2 <= r.x + r.w && y2 >= r.y && y2 <= r.y + r.h) return true;
  const dx = x2 - x1;
  const dy = y2 - y1;
  // Check each rectangle edge for a crossing.
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    const den = dx * (ey2 - ey1) - dy * (ex2 - ex1);
    if (den === 0) continue;
    const t = ((ex1 - x1) * (ey2 - ey1) - (ey1 - y1) * (ex2 - ex1)) / den;
    const u = ((ex1 - x1) * dy - (ey1 - y1) * dx) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}

// True when nothing solid stands between the two points. `solids` are rectangles.
export function lineOfSightClear(x1, y1, x2, y2, solids) {
  for (const r of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return false;
  }
  return true;
}

// Move a circle by (dx,dy), sliding along solid rectangles instead of sticking.
export function moveCircle(x, y, r, dx, dy, solids) {
  let nx = x + dx;
  for (const s of solids) {
    if (nx + r > s.x && nx - r < s.x + s.w && y + r > s.y && y - r < s.y + s.h) {
      nx = dx > 0 ? s.x - r : s.x + s.w + r;
    }
  }
  let ny = y + dy;
  for (const s of solids) {
    if (nx + r > s.x && nx - r < s.x + s.w && ny + r > s.y && ny - r < s.y + s.h) {
      ny = dy > 0 ? s.y - r : s.y + s.h + r;
    }
  }
  return { x: nx, y: ny };
}

// Distance from a point to a segment, for laser trips and rope proximity.
export function pointSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = clamp(t, 0, 1);
  return dist(px, py, x1 + t * dx, y1 + t * dy);
}
