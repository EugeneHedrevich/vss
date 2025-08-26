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
  const [opacityLevel, setOpacityLevel] = useState(0.5);
  const [ghostX, setGhostX] = useState(10);
  const [ghostY, setGhostY] = useState(10);
  const [haloIntensity, setHaloIntensity] = useState(0.76);
  const [haloOpacity, setHaloOpacity] = useState(0.5);
  const [haloDiameter, setHaloDiameter] = useState(30);

  // Blue-field controls
  const [numSquigglies, setNumSquigglies] = useState(60);
  const [blueOpacity, setBlueOpacity] = useState(0.7);

  // Floaters controls
  const [floaterCount, setFloaterCount] = useState(5);
  const [floaterTail, setFloaterTail] = useState(40);
  const [floaterOpacity, setFloaterOpacity] = useState(0.5);
  const [floaterDarkness, setFloaterDarkness] = useState(0.5);

  const baseCanvasRef = useRef(null);     // base image + non-halo effects
  const haloCanvasRef = useRef(null);     // overlay (only for halo)
  const imageRef = useRef(new Image());
  const rafRef = useRef(null);

  const lastBaseSizeRef = useRef({ w: 0, h: 0 });

  // Reset pooled effects when switching screen/effect
  useEffect(() => {
    resetBlueField();
    resetFloaters();
  }, [image, effectType]);

  useEffect(() => {
    if (effectType === "floaters") resetFloaters();
  }, [floaterTail, effectType]);

  // --- Base canvas sizing (simple, same as before) ---
  const fitBaseCanvas = (canvas) => {
    const rect = canvas.getBoundingClientRect();
    const targetW = Math.max(1, Math.round(rect.width));
    const targetH = Math.max(1, Math.round(rect.height));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      return true;
    }
    return false;
  };

  // --- Halo overlay DPR-aware sizing (isolated to halo only) ---
  const fitHaloCanvasDPR = (canvas) => {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const targetW = Math.max(1, Math.round(rect.width * dpr));
    const targetH = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    // draw in CSS pixels on the halo layer
    canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    return { rect, dpr };
  };

  // Click on the halo overlay → log CSS + image-space
  const handleHaloClick = (e) => {
    const canvas = haloCanvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;

    const natW = imageRef.current.naturalWidth || rect.width;
    const natH = imageRef.current.naturalHeight || rect.height;

    const imgX = cssX * (natW / rect.width);
    const imgY = cssY * (natH / rect.height);

    console.log("Halo position (image space):", { x: imgX, y: imgY });
    console.log("Halo position (CSS space):", { x: cssX, y: cssY });

    return { cssX, cssY, imgX, imgY };
  };

  useEffect(() => {
    const baseCanvas = baseCanvasRef.current;
    const baseCtx = baseCanvas.getContext("2d");
    const img = imageRef.current;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    img.src = image;

    img.onload = () => {
      // CSS size for both canvases (same rectangle)
      const aspect = img.naturalHeight / img.naturalWidth;
      const cssW = Math.min(img.naturalWidth, Math.floor(window.innerWidth * 0.9));
      const cssH = Math.round(cssW * aspect);

      // Set CSS size for base and (if present) halo canvases
      baseCanvas.style.width = `${cssW}px`;
      baseCanvas.style.height = `${cssH}px`;

      if (haloCanvasRef.current) {
        haloCanvasRef.current.style.width = `${cssW}px`;
        haloCanvasRef.current.style.height = `${cssH}px`;
      }

      const drawFrame = () => {
        // --- Base canvas render (no DPR transform) ---
        const resized = fitBaseCanvas(baseCanvas);
        if (resized) {
          const { width: w, height: h } = baseCanvas;
          if (w !== lastBaseSizeRef.current.w || h !== lastBaseSizeRef.current.h) {
            lastBaseSizeRef.current = { w, h };
            resetBlueField();
            resetFloaters();
          }
        }

        // draw base image/effects in base canvas' pixel coords
        baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
        baseCtx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height);

        if (effectType === "blur")  applyBlur(baseCtx, blurLevel);
        if (effectType === "noise") applyNoise(baseCtx, noiseLevel);
        if (effectType === "ghost")
          applyGhost(baseCtx, img, opacityLevel, ghostX, ghostY);

        if (effectType === "blueField") {
          applyBlueField(baseCtx, {
            count: numSquigglies,
            opacityMul: blueOpacity,
            backgroundDrawer: (ctx2) =>
              ctx2.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height),
          });
        }

        if (effectType === "floaters") {
          applyFloaters(baseCtx, {
            count: floaterCount,
            tailLength: floaterTail,
            darkness: floaterDarkness,
            opacity: floaterOpacity,
          });
        }

        // --- Halo overlay render (DPR-aware, CSS pixels) ---
        if (effectType === "halo" && haloCanvasRef.current) {
          const haloCanvas = haloCanvasRef.current;
          const { rect } = fitHaloCanvasDPR(haloCanvas); // sets CSS-px transform
          const haloCtx = haloCanvas.getContext("2d");
          // clear overlay in CSS px
          haloCtx.clearRect(0, 0, rect.width, rect.height);
          // draw halos mapped from image→CSS on the overlay
          applyHalo(haloCtx, img, haloIntensity, haloOpacity, haloDiameter);
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

      {/* Canvas stack: base + (conditional) halo overlay */}
      <div className="relative inline-block">
        <canvas ref={baseCanvasRef} className="border rounded-lg tg-canvas" />
        {effectType === "halo" && (
          <canvas
            ref={haloCanvasRef}
            className="absolute inset-0 rounded-lg"
            style={{ pointerEvents: "auto" }}
            onClick={handleHaloClick}
          />
        )}
      </div>

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
            <label>Интенсивность ореола: {haloIntensity.toFixed(2)}</label>
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
