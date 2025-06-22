export const applyGhost = (ctx, img, opacityLevel, ghostX, ghostY) => {
    ctx.globalAlpha = opacityLevel;
    ctx.drawImage(img, ghostX, ghostY, ctx.canvas.width * 0.95, ctx.canvas.height * 0.95);
    ctx.globalAlpha = 1;
};