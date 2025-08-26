import React, { useEffect, useRef, useState } from "react";
import { applyBlur } from "../effects/blurEffect";
import { applyNoise } from "../effects/noiseEffect";
import { applyGhost } from "../effects/ghostEffect";
import { applyHalo } from "../effects/haloEffect";
import { applyFloaters, resetFloaters } from "../effects/floaterEffect";
import { applyBlueField, resetBlueField } from "../effects/blueFieldEffect";

const VisualSnowSimulator = ({ image, effectType, onEffectSnapshot }) => {
  // effect state
  const [blurLevel, setBlurLevel] = useState(1);
  const [noiseLevel, setNoiseLevel] = useState(0.1);
  const [opacityLevel, setOpacityLevel] = useState(0.5);
  const [ghostX, setGhostX] = useState(10);
  const [ghostY, setGhostY] = useState(10);

  const [haloIntensity, setHaloIntensity] = useState(0.76);
  const [haloOpacity, setHaloOpacity] = useState(0.5);
  const [haloDiameter, setHaloDiameter] = useState(30);
  const [haloPoints, setHaloPoints] = useState([]); // image-space points

  const [numSquigglies, setNumSquigglies] = useState(60);
  const [blueOpacity, setBlueOpacity] = useState(0.7);

  const [floaterCount, setFloaterCount] = useState(5);
  const [floaterTail, setFloaterTail] = useState(40);
  const [floaterOpacity, setFloaterOpacity] = useState(0.5);
  const [floaterDarkness, setFloaterDarkness] = useState(0.5);

  // canvases & image
  const baseCanvasRef = useRef(null); // base effects
  const haloCanvasRef = useRef(null); // overlay for halos only
  const imageRef = useRef(new Image());
  const rafRef = useRef(null);
  const lastBaseSizeRef = useRef({ w: 0, h: 0 });

  // emitter
  const emit = (patch) => {
    if (!onEffectSnapshot) return;
    onEffectSnapshot({ effectType, values: patch });
  };

  // reset per-screen
  useEffect(() => {
    resetBlueField();
    resetFloaters();
    setHaloPoints([]);
    emit({ positions: [] }); // ensure cleared in parent
  }, [image, effectType]);

  useEffect(() => {
    if (effectType === "floaters") resetFloaters();
  }, [floaterTail, effectType]);

  // base canvas sizing (no DPR tricks)
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

  // halo overlay — DPR-aware
  const fitHaloCanvasDPR = (canvas) => {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const targetW = Math.max(1, Math.round(rect.width * dpr));
    const targetH = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    return { rect, dpr };
  };

  // render loop
  useEffect(() => {
    const baseCanvas = baseCanvasRef.current;
    const baseCtx = baseCanvas.getContext("2d");
    const img = imageRef.current;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    img.src = image;

    img.onload = () => {
      const aspect = img.naturalHeight / img.naturalWidth;
      const cssW = Math.min(img.naturalWidth, Math.floor(window.innerWidth * 0.9));
      const cssH = Math.round(cssW * aspect);
      baseCanvas.style.width = `${cssW}px`;
      baseCanvas.style.height = `${cssH}px`;
      if (haloCanvasRef.current) {
        haloCanvasRef.current.style.width = `${cssW}px`;
        haloCanvasRef.current.style.height = `${cssH}px`;
      }

      const drawFrame = () => {
        const resized = fitBaseCanvas(baseCanvas);
        if (resized) {
          const { width: w, height: h } = baseCanvas;
          if (w !== lastBaseSizeRef.current.w || h !== lastBaseSizeRef.current.h) {
            lastBaseSizeRef.current = { w, h };
            resetBlueField();
            resetFloaters();
          }
        }

        // base draw
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

        // halo overlay
        if (effectType === "halo" && haloCanvasRef.current) {
          const haloCanvas = haloCanvasRef.current;
          const { rect } = fitHaloCanvasDPR(haloCanvas);
          const haloCtx = haloCanvas.getContext("2d");
          haloCtx.clearRect(0, 0, rect.width, rect.height);

          const defaultPositions = [
            { x: 297, y: 156.6875 },
            { x: 195, y: 262.6875 },
            { x: 153, y: 312.6875 },
          ];

          applyHalo(
            haloCtx,
            img,
            haloIntensity,
            haloOpacity,
            haloDiameter,
            haloPoints.length ? haloPoints : defaultPositions
          );
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
    opacityLevel, ghostX, ghostY,
    // halo
    haloIntensity, haloOpacity, haloDiameter, haloPoints,
    // bluefield
    numSquigglies, blueOpacity,
    // floaters
    floaterCount, floaterTail, floaterOpacity, floaterDarkness,
  ]);

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-xl font-bold mb-4">Симулятор визуального снега</h1>

      <div className="relative inline-block">
        <canvas ref={baseCanvasRef} className="border rounded-lg tg-canvas" />
        {effectType === "halo" && (
          <canvas
            ref={haloCanvasRef}
            className="absolute inset-0 rounded-lg"
            style={{ pointerEvents: "auto" }}
            title="Нажмите, чтобы добавить ореол"
          />
        )}
      </div>

      {/* Controls — every change emits up */}
      <div className="mt-4 flex flex-col items-center w-64">
        {effectType === "blur" && (
          <>
            <label>Уровень размытия: {blurLevel}</label>
            <input
              type="range" min="0" max="10" step="0.1" value={blurLevel}
              onChange={(e) => { const v = parseFloat(e.target.value); setBlurLevel(v); emit({ blurLevel: v }); }}
              className="w-full"
            />
          </>
        )}

        {effectType === "noise" && (
          <>
            <label>Уровень шума: {noiseLevel}</label>
            <input
              type="range" min="0" max="1" step="0.01" value={noiseLevel}
              onChange={(e) => { const v = parseFloat(e.target.value); setNoiseLevel(v); emit({ noiseLevel: v }); }}
              className="w-full"
            />
          </>
        )}

        {effectType === "ghost" && (
          <>
            <label>Прозрачность двоения: {opacityLevel}</label>
            <input
              type="range" min="0" max="1" step="0.01" value={opacityLevel}
              onChange={(e) => { const v = parseFloat(e.target.value); setOpacityLevel(v); emit({ opacityLevel: v }); }}
              className="w-full"
            />

            <label>Смещение двоения по X: {ghostX}</label>
            <input
              type="range" min="-50" max="50" value={ghostX}
              onChange={(e) => { const v = parseInt(e.target.value, 10); setGhostX(v); emit({ ghostX: v }); }}
              className="w-full"
            />

            <label>Смещение двоения по Y: {ghostY}</label>
            <input
              type="range" min="-50" max="50" value={ghostY}
              onChange={(e) => { const v = parseInt(e.target.value, 10); setGhostY(v); emit({ ghostY: v }); }}
              className="w-full"
            />
          </>
        )}

        {effectType === "halo" && (
          <>
            <label>Интенсивность ореола: {haloIntensity.toFixed(2)}</label>
            <input
              type="range" min="0" max="1" step="0.01" value={haloIntensity}
              onChange={(e) => { const v = parseFloat(e.target.value); setHaloIntensity(v); emit({ haloIntensity: v }); }}
              className="w-full"
            />

            <label>Прозрачность ореола: {haloOpacity}</label>
            <input
              type="range" min="0" max="1" step="0.01" value={haloOpacity}
              onChange={(e) => { const v = parseFloat(e.target.value); setHaloOpacity(v); emit({ haloOpacity: v }); }}
              className="w-full"
            />

            <label>Диаметр ореола: {haloDiameter}</label>
            <input
              type="range" min="1" max="100" step="1" value={haloDiameter}
              onChange={(e) => { const v = parseInt(e.target.value, 10); setHaloDiameter(v); emit({ haloDiameter: v }); }}
              className="w-full"
            />
          </>
        )}

        {effectType === "blueField" && (
          <>
            <label>Количество точек: {numSquigglies}</label>
            <input
              type="range" min="5" max="120" value={numSquigglies}
              onChange={(e) => { const v = parseInt(e.target.value, 10); setNumSquigglies(v); emit({ numSquigglies: v }); }}
              className="w-full"
            />
            <label>Прозрачность: {blueOpacity.toFixed(2)}</label>
            <input
              type="range" min="0" max="1" step="0.01" value={blueOpacity}
              onChange={(e) => { const v = parseFloat(e.target.value); setBlueOpacity(v); emit({ blueOpacity: v }); }}
              className="w-full"
            />
          </>
        )}

        {effectType === "floaters" && (
          <>
            <label>Количество «мутных тел»: {floaterCount}</label>
            <input
              type="range" min="1" max="15" value={floaterCount}
              onChange={(e) => { const v = parseInt(e.target.value, 10); setFloaterCount(v); emit({ floaterCount: v }); }}
              className="w-full"
            />
            <label>Длина хвоста: {floaterTail}</label>
            <input
              type="range" min="1" max="100" value={floaterTail}
              onChange={(e) => { const v = parseInt(e.target.value, 10); setFloaterTail(v); emit({ floaterTail: v }); }}
              className="w-full"
            />
            <label>Прозрачность: {floaterOpacity.toFixed(2)}</label>
            <input
              type="range" min="0" max="1" step="0.01" value={floaterOpacity}
              onChange={(e) => { const v = parseFloat(e.target.value); setFloaterOpacity(v); emit({ floaterOpacity: v }); }}
              className="w-full"
            />
            <label>Темнота: {floaterDarkness.toFixed(2)}</label>
            <input
              type="range" min="0" max="1" step="0.01" value={floaterDarkness}
              onChange={(e) => { const v = parseFloat(e.target.value); setFloaterDarkness(v); emit({ floaterDarkness: v }); }}
              className="w-full"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default VisualSnowSimulator;
