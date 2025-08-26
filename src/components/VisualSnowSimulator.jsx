// src/components/VisualSnowSimulator.jsx
import React, { useEffect, useRef, useState } from "react";
import { applyBlur } from "../effects/blurEffect";
import { applyNoise } from "../effects/noiseEffect";
import { applyGhost } from "../effects/ghostEffect";
import { applyHalo } from "../effects/haloEffect";
import { applyFloaters, resetFloaters } from "../effects/floaterEffect";
import { applyBlueField, resetBlueField } from "../effects/blueFieldEffect";

const VisualSnowSimulator = ({ image, effectType }) => {
  const [blurLevel, setBlurLevel] = useState(1);
  const [noiseLevel, setNoiseLevel] = useState(0.1);
  const [opacityLevel, setOpacityLevel] = useState(0.5); // ghost opacity
  const [ghostX, setGhostX] = useState(10);
  const [ghostY, setGhostY] = useState(10);
  const [haloIntensity, setHaloIntensity] = useState(0.3);
  const [haloOpacity, setHaloOpacity] = useState(0.5);
  const [haloDiameter, setHaloDiameter] = useState(30);

  // Blue-field controls
  const [numSquigglies, setNumSquigglies] = useState(60);
  const [blueOpacity, setBlueOpacity] = useState(0.7);

  // Floaters controls
  const [floaterCount, setFloaterCount] = useState(5);
  const [floaterTail, setFloaterTail] = useState(40);
  const [floaterOpacity, setFloaterOpacity] = useState(0.5);
  const [floaterDarkness, setFloaterDarkness] = useState(0.5); // 0=light, 1=dark

  const canvasRef = useRef(null);
  const imageRef = useRef(new Image());
  const rafRef = useRef(null);

  // Track last canvas pixel size to know when to reset pools
  const lastSizeRef = useRef({ w: 0, h: 0 });

  // Reset effect states when switching screen/effect
  useEffect(() => {
    resetBlueField();
    resetFloaters();
  }, [image, effectType]);

  // Reset floaters immediately when tail length changes (prevents long connectors)
  useEffect(() => {
    if (effectType === "floaters") resetFloaters();
  }, [floaterTail, effectType]);

  // Helper: make canvas pixels match CSS size * devicePixelRatio*
  const fitCanvasToDisplay = (canvas) => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const targetW = Math.max(1, Math.round(rect.width * dpr));
    const targetH = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      return true; // size changed
    }
    return false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imageRef.current;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    img.src = image;

    img.onload = () => {
      // Set an initial CSS size (keeps consistent layout); pixels handled by fitCanvasToDisplay
      canvas.style.width = `${img.width / 2}px`;
      canvas.style.height = `${img.height / 2}px`;

      const drawFrame = () => {
        // Ensure canvas pixels match CSS*DPR; reset pools if the pixel size changed
        const resized = fitCanvasToDisplay(canvas);
        if (resized) {
          const { width: w, height: h } = canvas;
          if (w !== lastSizeRef.current.w || h !== lastSizeRef.current.h) {
            lastSizeRef.current = { w, h };
            resetBlueField();
            resetFloaters();
          }
        }

        // Draw base image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Apply effects
        if (effectType === "blur") applyBlur(ctx, blurLevel);
        if (effectType === "noise") applyNoise(ctx, noiseLevel);
        if (effectType === "ghost")
          applyGhost(ctx, img, opacityLevel, ghostX, ghostY);
        if (effectType === "halo")
          applyHalo(ctx, img, haloIntensity, haloOpacity, haloDiameter);

        if (effectType === "blueField") {
          applyBlueField(ctx, {
            count: numSquigglies,
            opacityMul: blueOpacity,
            backgroundDrawer: (ctx2) =>
              ctx2.drawImage(img, 0, 0, canvas.width, canvas.height),
          });
        }

        if (effectType === "floaters") {
          applyFloaters(ctx, {
            count: floaterCount,
            tailLength: floaterTail,
            darkness: floaterDarkness, // 0..1 (light->dark)
            opacity: floaterOpacity,
          });
        }

        rafRef.current = requestAnimationFrame(drawFrame);
      };

      drawFrame();
    };

    return () => {
      img.onload = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    image,
    effectType,
    // blur
    blurLevel,
    // noise
    noiseLevel,
    // ghost
    opacityLevel,
    ghostX,
    ghostY,
    // halo
    haloIntensity,
    haloOpacity,
    haloDiameter,
    // blue-field
    numSquigglies,
    blueOpacity,
    // floaters
    floaterCount,
    floaterTail,
    floaterOpacity,
    floaterDarkness,
  ]);

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-xl font-bold mb-4">Симулятор визуального снега</h1>
      <canvas ref={canvasRef} className="border rounded-lg" />

      <div className="mt-4 flex flex-col items-center w-64">
        {effectType === "blur" && (
          <>
            <label>Уровень размытия: {blurLevel}</label>
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
            <label>Уровень шума: {noiseLevel}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={noiseLevel}
              onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
              className="w-full"
            />
          </>
        )}

        {effectType === "ghost" && (
          <>
            <label>Прозрачность двоения: {opacityLevel}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={opacityLevel}
              onChange={(e) => setOpacityLevel(parseFloat(e.target.value))}
              className="w-full"
            />

            <label>Смещение двоения по X: {ghostX}</label>
            <input
              type="range"
              min="-50"
              max="50"
              value={ghostX}
              onChange={(e) => setGhostX(parseInt(e.target.value))}
              className="w-full"
            />

            <label>Смещение двоения по Y: {ghostY}</label>
            <input
              type="range"
              min="-50"
              max="50"
              value={ghostY}
              onChange={(e) => setGhostY(parseInt(e.target.value))}
              className="w-full"
            />
          </>
        )}

        {effectType === "halo" && (
          <>
            <label>Интенсивность ореола: {haloIntensity}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={haloIntensity}
              onChange={(e) => setHaloIntensity(parseFloat(e.target.value))}
              className="w-full"
            />

            <label>Прозрачность ореола: {haloOpacity}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={haloOpacity}
              onChange={(e) => setHaloOpacity(parseFloat(e.target.value))}
              className="w-full"
            />

            <label>Диаметр ореола: {haloDiameter}</label>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={haloDiameter}
              onChange={(e) => setHaloDiameter(parseInt(e.target.value))}
              className="w-full"
            />
          </>
        )}

        {effectType === "blueField" && (
          <>
            <label>Количество точек: {numSquigglies}</label>
            <input
              type="range"
              min="5"
              max="120"
              value={numSquigglies}
              onChange={(e) => setNumSquigglies(parseInt(e.target.value))}
              className="w-full"
            />

            <label>Прозрачность: {blueOpacity.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={blueOpacity}
              onChange={(e) => setBlueOpacity(parseFloat(e.target.value))}
              className="w-full"
            />
          </>
        )}

        {effectType === "floaters" && (
          <>
            <label>Количество «мутных тел»: {floaterCount}</label>
            <input
              type="range"
              min="1"
              max="15"
              value={floaterCount}
              onChange={(e) => setFloaterCount(parseInt(e.target.value))}
              className="w-full"
            />

            <label>Длина хвоста: {floaterTail}</label>
            <input
              type="range"
              min="1"
              max="100"
              value={floaterTail}
              onChange={(e) => setFloaterTail(parseInt(e.target.value))}
              className="w-full"
            />

            <label>Прозрачность: {floaterOpacity.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={floaterOpacity}
              onChange={(e) => setFloaterOpacity(parseFloat(e.target.value))}
              className="w-full"
            />

            <label>Темнота: {floaterDarkness.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={floaterDarkness}
              onChange={(e) => setFloaterDarkness(parseFloat(e.target.value))}
              className="w-full"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default VisualSnowSimulator;
