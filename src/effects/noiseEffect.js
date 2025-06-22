export const applyNoise = (ctx, noiseLevel) => {
    const canvas = ctx.canvas;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
        const randomNoise = (Math.random() - 0.5) * noiseLevel * 255;
        pixels[i] += randomNoise;
        pixels[i + 1] += randomNoise;
        pixels[i + 2] += randomNoise;
    }
    ctx.putImageData(imageData, 0, 0);
};