// src/effects/floaterEffect.js
let pool = null;

// Motion (constant speed + slow rotation for life-like wobble)
const SPEED = 0.6;        // px / frame
const ROT_RATE = 0.002;   // rad / frame

// Squiggle geometry
const SEG_LEN = 6;        // px between points
const CURVE_JITTER = 0.35; // angle noise per segment (0..1)
const MIN_SEGS = 6;       // don't let shapes get too short visually

export function applyFloaters(ctx, { count, tailLength, darkness, opacity }) {
  const { canvas } = ctx;

  // init/resize pool
  if (!pool) pool = [];
  while (pool.length < count) pool.push(makeFloater(canvas));
  if (pool.length > count) pool.length = count;

  // stroke style (light -> dark grayscale)
  const shade = Math.round(255 * (1 - clamp01(darkness)));
  ctx.strokeStyle = `rgba(${shade},${shade},${shade},${clamp01(opacity)})`;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const segsNeeded = Math.max(MIN_SEGS, Math.round(tailLength / SEG_LEN));

  for (const f of pool) {
    // extend the squiggle if we need more segments for the new tail length
    ensurePathLength(f, segsNeeded);

    // constant drift + slow rotation
    f.x += Math.cos(f.heading) * SPEED;
    f.y += Math.sin(f.heading) * SPEED;
    f.rotation += f.rotDir * ROT_RATE;

    // wrap around edges; path is local so no artifact risk
    const pad = 20;
    if (f.x < -pad) f.x = canvas.width + pad;
    if (f.x > canvas.width + pad) f.x = -pad;
    if (f.y < -pad) f.y = canvas.height + pad;
    if (f.y > canvas.height + pad) f.y = -pad;

    // draw only the first N points (dynamic "tail length")
    drawPrefix(ctx, f, segsNeeded);
  }
}

export function resetFloaters() {
  pool = null;
}

// ---------- internals ----------

function makeFloater(canvas) {
  const p = {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    heading: Math.random() * Math.PI * 2,
    rotation: Math.random() * Math.PI * 2,
    rotDir: Math.random() < 0.5 ? 1 : -1,
    angle: 0,           // internal angle for path growth
    path: [{ x: 0, y: 0 }], // local points around origin
    centroid: { x: 0, y: 0 },
  };
  // seed a few segments so it doesn't start as a dot
  ensurePathLength(p, MIN_SEGS + 4);
  centerPath(p);
  return p;
}

function ensurePathLength(f, targetSegs) {
  // grow the same squiggle forward, no regeneration
  while (f.path.length < targetSegs) {
    f.angle += (Math.random() - 0.5) * CURVE_JITTER;
    const last = f.path[f.path.length - 1];
    f.path.push({
      x: last.x + Math.cos(f.angle) * SEG_LEN,
      y: last.y + Math.sin(f.angle) * SEG_LEN,
    });
  }
  // re-center occasionally to keep rotation natural as it grows
  // (cheap; runs only when we extend)
  centerPath(f);
}

function centerPath(f) {
  let cx = 0, cy = 0;
  for (const p of f.path) { cx += p.x; cy += p.y; }
  cx /= f.path.length; cy /= f.path.length;
  f.centroid.x = cx; f.centroid.y = cy;
}

function drawPrefix(ctx, f, segs) {
  const n = Math.min(segs, f.path.length);
  if (n < 2) return;

  const cos = Math.cos(f.rotation);
  const sin = Math.sin(f.rotation);

  const cx = f.centroid.x;
  const cy = f.centroid.y;

  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const p = f.path[i];
    // transform local point (centered) -> world
    const lx = p.x - cx;
    const ly = p.y - cy;
    const wx = f.x + lx * cos - ly * sin;
    const wy = f.y + lx * sin + ly * cos;

    if (i === 0) ctx.moveTo(wx, wy);
    else ctx.lineTo(wx, wy);
  }
  ctx.stroke();
}

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
