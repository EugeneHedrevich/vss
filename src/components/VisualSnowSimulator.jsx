import React, { useEffect, useRef, useState } from "react";
import { applyBlur } from "../effects/blurEffect";
import { applyNoise } from "../effects/noiseEffect";
import { applyGhost } from "../effects/ghostEffect";
import { applyHalo } from "../effects/haloEffect";
import { applyBlueField } from "../effects/blueFieldEffect";

const VisualSnowSimulator = ({ image, effectType }) => {
    const [blurLevel, setBlurLevel] = useState(1);
    const [noiseLevel, setNoiseLevel] = useState(0.1);
    const [opacityLevel, setOpacityLevel] = useState(0.5);
    const [ghostX, setGhostX] = useState(10);
    const [ghostY, setGhostY] = useState(10);
    const [haloIntensity, setHaloIntensity] = useState(0.3);
    const [haloOpacity, setHaloOpacity] = useState(0.5);
    const [haloDiameter, setHaloDiameter] = useState(30);

    const [numSquigglies, setNumSquigglies] = useState(30);
    const [updateSpeed, setUpdateSpeed] = useState(60);
    const [trailLength, setTrailLength] = useState(10);
    const [maxAngle, setMaxAngle] = useState(40);
    const [opacity, setOpacity] = useState(70);

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
    }, [image, blurLevel, noiseLevel, opacityLevel, ghostX, ghostY, haloIntensity, haloOpacity, haloDiameter, numSquigglies, updateSpeed, trailLength, maxAngle, opacity]);

    const animateEffect = (ctx, img) => {
        const canvas = ctx.canvas;

        const drawFrame = () => {
            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw the image on the canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Apply effects in the correct order
            if (effectType === "blur") applyBlur(ctx, blurLevel);
            if (effectType === "noise") applyNoise(ctx, noiseLevel);
            if (effectType === "ghost") applyGhost(ctx, img, opacityLevel, ghostX, ghostY);
            if (effectType === "halo") applyHalo(ctx, img, haloIntensity, haloOpacity, haloDiameter);
            if (effectType === "blueField") applyBlueField(ctx, numSquigglies, updateSpeed, trailLength, maxAngle, opacity);

            // Request the next frame
            requestAnimationFrame(drawFrame);
        };

        drawFrame();
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

                        <label className="mt-4 mb-2">Halo Opacity: {haloOpacity}</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={haloOpacity}
                            onChange={(e) => setHaloOpacity(parseFloat(e.target.value))}
                            className="w-full"
                        />

                        <label className="mt-4 mb-2">Halo Diameter: {haloDiameter}</label>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={haloDiameter}
                            onChange={(e) => setHaloDiameter(parseInt(e.target.value))}
                            className="w-full"
                        />
                    </>
                )}

                {effectType === "blueField" && (
                    <>
                        <label>Number of Squigglies: {numSquigglies}</label>
                        <input type="range" min="5" max="100" value={numSquigglies} onChange={(e) => setNumSquigglies(parseInt(e.target.value))} className="w-full" />

                        <label>Update Speed: {updateSpeed}</label>
                        <input type="range" min="10" max="100" value={updateSpeed} onChange={(e) => setUpdateSpeed(parseInt(e.target.value))} className="w-full" />

                        <label>Trail Length: {trailLength}</label>
                        <input type="range" min="5" max="30" value={trailLength} onChange={(e) => setTrailLength(parseInt(e.target.value))} className="w-full" />

                        <label>Max Angle to Turn: {maxAngle}</label>
                        <input type="range" min="10" max="90" value={maxAngle} onChange={(e) => setMaxAngle(parseInt(e.target.value))} className="w-full" />

                        <label>Opacity: {opacity}</label>
                        <input type="range" min="10" max="100" value={opacity} onChange={(e) => setOpacity(parseInt(e.target.value))} className="w-full" />
                    </>
                )}
            </div>
        </div>
    );
};

export default VisualSnowSimulator;