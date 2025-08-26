// src/effects/blurEffect.js

// --- tiny stack blur fallback ---
function stackBlur(ctx, radius) {
  const { width: w, height: h } = ctx.canvas;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const r = Math.max(1, Math.floor(radius));

  const pass = (dir) => {
    const stepX = dir === "h" ? 1 : 0;
    const stepY = dir === "h" ? 0 : 1;
    const lenOuter = dir === "h" ? h : w;
    const lenInner = dir === "h" ? w : h;

    for (let outer = 0; outer < lenOuter; outer++) {
      let sumR = 0, sumG = 0, sumB = 0, sumA = 0;
      const base = dir === "h" ? outer * w : outer;

      for (let i = -r; i <= r; i++) {
        const idx = Math.min(lenInner - 1, Math.max(0, i));
        const p = (dir === "h"
          ? ((base + idx) * 4)
          : (((idx * w) + base) * 4));
        sumR += data[p]; sumG += data[p + 1]; sumB += data[p + 2]; sumA += data[p + 3];
      }

      for (let inner = 0; inner < lenInner; inner++) {
        const outIdx = (dir === "h"
          ? ((base + inner) * 4)
          : (((inner * w) + base) * 4));
        const wsize = r * 2 + 1;
        data[outIdx]     = sumR / wsize;
        data[outIdx + 1] = sumG / wsize;
        data[outIdx + 2] = sumB / wsize;
        data[outIdx + 3] = sumA / wsize;

        const iOut = inner - r;
        const iIn  = inner + r + 1;

        const pOut = (dir === "h"
          ? ((base + Math.max(0, Math.min(lenInner - 1, iOut))) * 4)
          : (((Math.max(0, Math.min(lenInner - 1, iOut)) * w) + base) * 4));
        const pIn  = (dir === "h"
          ? ((base + Math.max(0, Math.min(lenInner - 1, iIn))) * 4)
          : (((Math.max(0, Math.min(lenInner - 1, iIn)) * w) + base) * 4));

        sumR += data[pIn] - data[pOut];
        sumG += data[pIn + 1] - data[pOut + 1];
        sumB += data[pIn + 2] - data[pOut + 2];
        sumA += data[pIn + 3] - data[pOut + 3];
      }
    }
  };

  pass("h"); pass("v"); pass("h");
  ctx.putImageData(imgData, 0, 0);
}

// offscreen buffer for filter
let offscreen = null;

export const applyBlur = (ctx, blurLevel) => {
  const radius = Math.max(0, Number(blurLevel) || 0);
  if (radius <= 0) return;

  const src = ctx.canvas;
  if (!offscreen || offscreen.width !== src.width || offscreen.height !== src.height) {
    offscreen = document.createElement("canvas");
    offscreen.width = src.width;
    offscreen.height = src.height;
  }
  const octx = offscreen.getContext("2d");

  // copy frame to offscreen
  octx.clearRect(0, 0, offscreen.width, offscreen.height);
  octx.drawImage(src, 0, 0);

  // if canvas filter supported → use it
  if ("filter" in octx) {
    ctx.save();
    ctx.clearRect(0, 0, src.width, src.height);
    ctx.filter = `blur(${radius}px)`;
    ctx.drawImage(offscreen, 0, 0);
    ctx.filter = "none";
    ctx.restore();
    return;
  }

  // fallback (Telegram iOS/Android webview)
  ctx.clearRect(0, 0, src.width, src.height);
  ctx.drawImage(offscreen, 0, 0);
  stackBlur(ctx, Math.min(20, radius * 1.5));
};
