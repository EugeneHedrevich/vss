import React, { useEffect, useRef, useState } from "react";

const VisualSnowSimulator = ({ image, effectType }) => {
    const [blurLevel, setBlurLevel] = useState(1);
    const [noiseLevel, setNoiseLevel] = useState(0.1);
    const [opacityLevel, setOpacityLevel] = useState(0.5);
    const [ghostX, setGhostX] = useState(10);
    const [ghostY, setGhostY] = useState(10);
    const [haloIntensity, setHaloIntensity] = useState(0.3);

    const canvasRef = useRef(null);
    const imageRef = useRef(new Image());

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const img = imageRef.current;

        img.src = image;
        img.crossOrigin = "anonymous";

        img.onload = () => {
            canvas.width = img.width / 2;
            canvas.height = img.height / 2;
            animateEffect(ctx, img);
        };

        return () => {
            img.onload = null;
        };
    }, [image, blurLevel, noiseLevel, opacityLevel, ghostX, ghostY, haloIntensity]);

    const animateEffect = (ctx, img) => {
        const canvas = ctx.canvas;

        const drawFrame = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1; // Reset alpha

            if (effectType === "blur") applyBlur(ctx);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            ctx.filter = "none";

            if (effectType === "noise") applyNoise(ctx);
            if (effectType === "ghost") applyGhost(ctx, img);
            if (effectType === "halo") applyHalo(ctx, img);

            requestAnimationFrame(drawFrame);
        };

        drawFrame();
    };

    const applyBlur = (ctx) => {
        ctx.filter = `blur(${blurLevel}px)`;
    };

    const applyNoise = (ctx) => {
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

    const applyGhost = (ctx, img) => {
        ctx.globalAlpha = opacityLevel;
        ctx.drawImage(img, ghostX, ghostY, ctx.canvas.width * 0.95, ctx.canvas.height * 0.95);
        ctx.globalAlpha = 1;
    };

    const applyHalo = (ctx, img) => {
        ctx.globalCompositeOperation = "lighter"; // Makes bright areas glow
        let width = ctx.canvas.width;
        let height = ctx.canvas.height;
        let imageData = ctx.getImageData(0, 0, width, height);
        let data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            let brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (brightness > 100) { // Apply halos to bright areas
                data[i] += haloIntensity * 255;
                data[i + 1] += haloIntensity * 255;
                data[i + 2] += haloIntensity * 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        ctx.globalCompositeOperation = "source-over";
    };

    return (
        <div className="p-4 flex flex-col items-center">
            <h1 className="text-xl font-bold mb-4">Visual Snow Simulator</h1>
            <canvas ref={canvasRef} className="border rounded-lg" />

            <div className="mt-4 flex flex-col items-center w-64">
                {effectType === "blur" && (
                    <>
                        <label className="mb-2">Blur Level: {blurLevel}</label>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.1"
                            value={blurLevel}
                            onChange={(e) => setBlurLevel(parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </>
                )}

                {effectType === "noise" && (
                    <>
                        <label className="mt-4 mb-2">Noise Level: {noiseLevel}</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={noiseLevel}
                            onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </>
                )}

                {effectType === "ghost" && (
                    <>
                        <label className="mt-4 mb-2">Ghost Opacity Level: {opacityLevel}</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={opacityLevel}
                            onChange={(e) => setOpacityLevel(parseFloat(e.target.value))}
                            className="w-full"
                        />

                        <label className="mt-4 mb-2">Ghost X Position: {ghostX}</label>
                        <input
                            type="range"
                            min="-50"
                            max="50"
                            step="1"
                            value={ghostX}
                            onChange={(e) => setGhostX(parseInt(e.target.value))}
                            className="w-full"
                        />

                        <label className="mt-4 mb-2">Ghost Y Position: {ghostY}</label>
                        <input
                            type="range"
                            min="-50"
                            max="50"
                            step="1"
                            value={ghostY}
                            onChange={(e) => setGhostY(parseInt(e.target.value))}
                            className="w-full"
                        />
                    </>
                )}

                {effectType === "halo" && (
                    <>
                        <label className="mt-4 mb-2">Halo Intensity: {haloIntensity}</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={haloIntensity}
                            onChange={(e) => setHaloIntensity(parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default VisualSnowSimulator;
