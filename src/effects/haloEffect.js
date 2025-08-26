// Draw halos using image-space positions mapped to the current CSS draw size.
export const applyHalo = (ctx, img, haloIntensity, haloOpacity, haloDiameter) => {
  // Your measured positions (image space). These are consistent on PC & mobile.
  const positions = [
    { x: 297, y: 156.6875 },
    { x: 195, y: 262.6875 },
    { x: 153, y: 312.6875 },
  ];

  // Current CSS size (ctx has been scaled so 1 unit = 1 CSS px).
  const rect = ctx.canvas.getBoundingClientRect();
  const cssW = rect.width;
  const cssH = rect.height;

  const natW = img.naturalWidth || cssW;
  const natH = img.naturalHeight || cssH;

  // Map image-space -> CSS-space
  const sx = cssW / natW;
  const sy = cssH / natH;

  const alpha = Math.max(0, Math.min(1, (haloOpacity || 0) * (haloIntensity || 0)));
  const r = Math.max(1, haloDiameter | 0); // radius in CSS pixels

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  positions.forEach(({ x, y }) => {
    const px = x * sx;
    const py = y * sy;

    const g = ctx.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, `rgba(255,255,255,${alpha})`);
    g.addColorStop(1, `rgba(255,255,255,0)`);

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
};
