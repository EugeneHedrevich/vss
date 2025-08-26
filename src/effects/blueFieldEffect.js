// blueField.js
const SPEED = 2;                 // constant physiological speed
const JITTER = 10;               // deg per step
const MIN_LEN = 2, MAX_LEN = 6;  // dash length in px
const MIN_LIFE = 10, MAX_LIFE = 20; // frames

let particles = null;

export function applyBlueField(ctx, { count, opacityMul, backgroundDrawer }) {
  const { canvas } = ctx;

  // 1) clear + draw background each frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (backgroundDrawer) backgroundDrawer(ctx);

  // 2) pool sizing
  if (!particles) {
    particles = Array.from({ length: count }, () => make(canvas));
  } else if (particles.length !== count) {
    particles.length = Math.min(particles.length, count);
    while (particles.length < count) particles.push(make(canvas));
  }

  // 3) update + draw short dashes
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    // heading jitter
    p.angle += (Math.random() - 0.5) * JITTER;

    // prev -> next
    const rad = (p.angle * Math.PI) / 180;
    const dx = Math.cos(rad) * SPEED;
    const dy = Math.sin(rad) * SPEED;
    const x2 = p.x + dx, y2 = p.y + dy;

    // alpha fades in/out over life; multiply by user opacity
    const lifeT = p.life / p.lifeMax; // 1 -> 0
    const alpha = (0.25 + 0.75 * lifeT) * opacityMul; // keep some floor

    // single dash only; never connect gaps
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    // dash end in heading direction with small length
    const lx = Math.cos(rad) * p.len;
    const ly = Math.sin(rad) * p.len;
    ctx.lineTo(p.x + lx, p.y + ly);
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`; // white “sparkle”
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.stroke();

    // commit new pos
    p.x = x2; p.y = y2;
    p.life--;

    // respawn out-of-bounds or life ended
    if (p.life <= 0 || x2 < 0 || y2 < 0 || x2 > canvas.width || y2 > canvas.height) {
      particles[i] = make(canvas);
    }
  }
}

export function resetBlueField() { particles = null; }

function make(canvas) {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    angle: Math.random() * 360,
    len: MIN_LEN + Math.random() * (MAX_LEN - MIN_LEN),
    lifeMax: Math.floor(MIN_LIFE + Math.random() * (MAX_LIFE - MIN_LIFE)),
    life:  Math.floor(MIN_LIFE + Math.random() * (MAX_LIFE - MIN_LIFE)),
  };
}
