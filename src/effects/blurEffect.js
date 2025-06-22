export const applyBlur = (ctx, blurLevel) => {
    ctx.filter = `blur(${blurLevel}px)`;
};