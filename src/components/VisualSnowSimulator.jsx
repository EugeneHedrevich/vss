import React, { useEffect, useRef, useState } from "react";

const VisualSnowSimulator = () => {
    const [blurLevel, setBlurLevel] = useState(1);
    const [noiseLevel, setNoiseLevel] = useState(0.1);
    const canvasRef = useRef(null);
    const imageRef = useRef(new Image());

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const img = imageRef.current;

        img.src = "/image.png";
        img.crossOrigin = "anonymous";

        img.onload = () => {
            canvas.width = img.width / 2;
            canvas.height = img.height / 2;
            animateEffect(ctx, img);
        };

        return () => {
            img.onload = null;
        };
    }, [blurLevel, noiseLevel]);

    const animateEffect = (ctx, img) => {
        const canvas = ctx.canvas;

        const drawFrame = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.filter = `blur(${blurLevel}px)`;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            ctx.filter = "none";

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            for (let i = 0; i < pixels.length; i += 4) {
                const randomNoise = (Math.random() - 0.5) * noiseLevel * 255;
                pixels[i] += randomNoise;
                pixels[i + 1] += randomNoise;
                pixels[i + 2] += randomNoise;
            }
            ctx.putImageData(imageData, 0, 0);

            requestAnimationFrame(drawFrame);
        };

        drawFrame();
    };

    return (
        <div className="p-4 flex flex-col items-center">
            <h1 className="text-xl font-bold mb-4">Visual Snow Simulator</h1>
            <canvas ref={canvasRef} className="border rounded-lg" />
            <div className="mt-4 flex flex-col items-center w-64">
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
            </div>
        </div>
    );
};

export default VisualSnowSimulator;
