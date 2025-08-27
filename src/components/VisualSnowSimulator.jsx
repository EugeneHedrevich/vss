import React, { useEffect, useRef, useState } from "react";
import { applyBlur } from "../effects/blurEffect";
import { applyNoise } from "../effects/noiseEffect";
import { applyGhost } from "../effects/ghostEffect";
import { applyHalo } from "../effects/haloEffect";
import { applyFloaters, resetFloaters } from "../effects/floaterEffect";
import { applyBlueField, resetBlueField } from "../effects/blueFieldEffect";

const EFFECT_DEFAULTS = {
  blur: { blurLevel: 1 },
  noise: { noiseLevel: 0.1 },
  ghost: { opacityLevel: 0.5, ghostX: 10, ghostY: 10 },
  halo: {
    haloIntensity: 0.76,
    haloOpacity: 0.5,
    haloDiameter: 30,
    positions: [],
  },
  blueField: { numSquigglies: 60, blueOpacity: 0.7 },
  floaters: {
    floaterCount: 5,
    floaterTail: 40,
    floaterOpacity: 0.5,
    floaterDarkness: 0.5,
  },
};

const ALLOWED_KEYS = {
  blur: ["blurLevel"],
  noise: ["noiseLevel"],
  ghost: ["opacityLevel", "ghostX", "ghostY"],
  halo: ["haloIntensity", "haloOpacity", "haloDiameter", "positions"],
  blueField: ["numSquigglies", "blueOpacity"],
  floaters: [
    "floaterCount",
    "floaterTail",
    "floaterOpacity",
    "floaterDarkness",
  ],
};

// numeric normalization (optional but keeps sheet clean)
const NORMALIZE = {
  blurLevel: (n) => +Number(n).toFixed(1),
  noiseLevel: (n) => +Number(n).toFixed(2),
  opacityLevel: (n) => +Number(n).toFixed(2),
  haloIntensity: (n) => +Number(n).toFixed(2),
  haloOpacity: (n) => +Number(n).toFixed(2),
  haloDiameter: (n) => +Number(n).toFixed(1),
  numSquigglies: (n) => +Number(n).toFixed(1),
  floaterCount: (n) => +Number(n).toFixed(1),
  floaterTail: (n) => +Number(n).toFixed(1),
  floaterOpacity: (n) => +Number(n).toFixed(2),
  floaterDarkness: (n) => +Number(n).toFixed(2),
  ghostX: (n) => +Number(n).toFixed(1),
  ghostY: (n) => +Number(n).toFixed(1),
};

// ------------ UPDATE FILTER ------------
function filterPatch(effectType, patch) {
  const allowed = new Set(ALLOWED_KEYS[effectType] || []);
  const out = {};
  Object.entries(patch || {}).forEach(([k, v]) => {
    if (!allowed.has(k)) return;
    if (typeof v === "number" && NORMALIZE[k]) out[k] = NORMALIZE[k](v);
    else out[k] = v;
  });
  return out;
}
// --------------------------------------

const VisualSnowSimulator = ({ image, effectType, onEffectSnapshot }) => {
  // local UI state
  const [blurLevel, setBlurLevel] = useState(EFFECT_DEFAULTS.blur.blurLevel);
  const [noiseLevel, setNoiseLevel] = useState(
    EFFECT_DEFAULTS.noise.noiseLevel
  );
  const [opacityLevel, setOpacityLevel] = useState(
    EFFECT_DEFAULTS.ghost.opacityLevel
  );
  const [ghostX, setGhostX] = useState(EFFECT_DEFAULTS.ghost.ghostX);
  const [ghostY, setGhostY] = useState(EFFECT_DEFAULTS.ghost.ghostY);

  const [haloIntensity, setHaloIntensity] = useState(
    EFFECT_DEFAULTS.halo.haloIntensity
  );
  const [haloOpacity, setHaloOpacity] = useState(
    EFFECT_DEFAULTS.halo.haloOpacity
  );
  const [haloDiameter, setHaloDiameter] = useState(
    EFFECT_DEFAULTS.halo.haloDiameter
  );
  const [haloPoints, setHaloPoints] = useState([]);

  const [numSquigglies, setNumSquigglies] = useState(
    EFFECT_DEFAULTS.blueField.numSquigglies
  );
  const [blueOpacity, setBlueOpacity] = useState(
    EFFECT_DEFAULTS.blueField.blueOpacity
  );

  const [floaterCount, setFloaterCount] = useState(
    EFFECT_DEFAULTS.floaters.floaterCount
  );
  const [floaterTail, setFloaterTail] = useState(
    EFFECT_DEFAULTS.floaters.floaterTail
  );
  const [floaterOpacity, setFloaterOpacity] = useState(
    EFFECT_DEFAULTS.floaters.floaterOpacity
  );
  const [floaterDarkness, setFloaterDarkness] = useState(
    EFFECT_DEFAULTS.floaters.floaterDarkness
  );

  // canvases & image
  const baseCanvasRef = useRef(null);
  const haloCanvasRef = useRef(null);
  const imageRef = useRef(new Image());
  const rafRef = useRef(null);
  const lastBaseSizeRef = useRef({ w: 0, h: 0 });

  // build current values for the active effect
  const buildCurrentValues = (eff) => {
    switch (eff) {
      case "blur":
        return { blurLevel };
      case "noise":
        return { noiseLevel };
      case "ghost":
        return { opacityLevel, ghostX, ghostY };
      case "halo":
        return {
          haloIntensity,
          haloOpacity,
          haloDiameter,
          positions: haloPoints,
        };
      case "blueField":
        return { numSquigglies, blueOpacity };
      case "floaters":
        return { floaterCount, floaterTail, floaterOpacity, floaterDarkness };
      default:
        return {};
    }
  };

  // emit a full, filtered snapshot for current effect
  const emitFull = (eff, extraPatch) => {
    if (!onEffectSnapshot) return;
    const merged = { ...buildCurrentValues(eff), ...(extraPatch || {}) };
    const filtered = filterPatch(eff, merged);
    onEffectSnapshot({ effectType: eff, values: filtered, image });
  };

  // central update helper (applies patch to local state and emits snapshot)
  const update = (eff, patch) => {
    const filtered = filterPatch(eff, patch);
    if (!Object.keys(filtered).length) return;

    Object.entries(filtered).forEach(([k, v]) => {
      switch (k) {
        case "blurLevel":
          setBlurLevel(v);
          break;
        case "noiseLevel":
          setNoiseLevel(v);
          break;
        case "opacityLevel":
          setOpacityLevel(v);
          break;
        case "ghostX":
          setGhostX(v);
          break;
        case "ghostY":
          setGhostY(v);
          break;
        case "haloIntensity":
          setHaloIntensity(v);
          break;
        case "haloOpacity":
          setHaloOpacity(v);
          break;
        case "haloDiameter":
          setHaloDiameter(v);
          break;
        case "positions":
          setHaloPoints(Array.isArray(v) ? v : []);
          break;
        case "numSquigglies":
          setNumSquigglies(v);
          break;
        case "blueOpacity":
          setBlueOpacity(v);
          break;
        case "floaterCount":
          setFloaterCount(v);
          break;
        case "floaterTail":
          setFloaterTail(v);
          break;
        case "floaterOpacity":
          setFloaterOpacity(v);
          break;
        case "floaterDarkness":
          setFloaterDarkness(v);
          break;
        default:
          break;
      }
    });

    emitFull(eff);
  };

  // reset per screen/effect; emit defaults immediately so backend gets numbers even if user doesn't touch controls
  useEffect(() => {
    resetBlueField();
    resetFloaters();
    setHaloPoints([]);
    emitFull(effectType, EFFECT_DEFAULTS[effectType] || {});
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
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
      const cssW = Math.min(
        img.naturalWidth,
        Math.floor(window.innerWidth * 0.9)
      );
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
          const w = baseCanvas.width,
            h = baseCanvas.height;
          if (
            w !== lastBaseSizeRef.current.w ||
            h !== lastBaseSizeRef.current.h
          ) {
            lastBaseSizeRef.current = { w, h };
            resetBlueField();
            resetFloaters();
          }
        }

        // base draw
        baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
        baseCtx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height);

        if (effectType === "blur") applyBlur(baseCtx, blurLevel);
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
    opacityLevel,
    ghostX,
    ghostY,
    // halo
    haloIntensity,
    haloOpacity,
    haloDiameter,
    haloPoints,
    // bluefield
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

      {/* Controls — every change -> update() -> filtered emit */}
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
              onChange={(e) =>
                update("blur", { blurLevel: parseFloat(e.target.value) })
              }
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
              onChange={(e) =>
                update("noise", { noiseLevel: parseFloat(e.target.value) })
              }
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
              onChange={(e) =>
                update("ghost", { opacityLevel: parseFloat(e.target.value) })
              }
              className="w-full"
            />

            <label>Смещение двоения по X: {ghostX}</label>
            <input
              type="range"
              min="-50"
              max="50"
              value={ghostX}
              onChange={(e) =>
                update("ghost", { ghostX: parseInt(e.target.value, 10) })
              }
              className="w-full"
            />

            <label>Смещение двоения по Y: {ghostY}</label>
            <input
              type="range"
              min="-50"
              max="50"
              value={ghostY}
              onChange={(e) =>
                update("ghost", { ghostY: parseInt(e.target.value, 10) })
              }
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
              onChange={(e) =>
                update("halo", { haloIntensity: parseFloat(e.target.value) })
              }
              className="w-full"
            />

            <label>Прозрачность ореола: {haloOpacity}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={haloOpacity}
              onChange={(e) =>
                update("halo", { haloOpacity: parseFloat(e.target.value) })
              }
              className="w-full"
            />

            <label>Диаметр ореола: {haloDiameter}</label>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={haloDiameter}
              onChange={(e) =>
                update("halo", { haloDiameter: parseInt(e.target.value, 10) })
              }
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
              onChange={(e) =>
                update("blueField", {
                  numSquigglies: parseInt(e.target.value, 10),
                })
              }
              className="w-full"
            />
            <label>Прозрачность: {blueOpacity.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={blueOpacity}
              onChange={(e) =>
                update("blueField", { blueOpacity: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </>
        )}

        {effectType === "floaters" && (
          <>
            <label>Количество «мутных тел»: {floaterCount}</label>
            <input
              type="range"
              min="0"
              max="15"
              value={floaterCount}
              onChange={(e) =>
                update("floaters", {
                  floaterCount: parseInt(e.target.value, 10),
                })
              }
              className="w-full"
            />
            <label>Длина хвоста: {floaterTail}</label>
            <input
              type="range"
              min="1"
              max="100"
              value={floaterTail}
              onChange={(e) =>
                update("floaters", {
                  floaterTail: parseInt(e.target.value, 10),
                })
              }
              className="w-full"
            />
            <label>Прозрачность: {floaterOpacity.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={floaterOpacity}
              onChange={(e) =>
                update("floaters", {
                  floaterOpacity: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
            <label>Темнота: {floaterDarkness.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={floaterDarkness}
              onChange={(e) =>
                update("floaters", {
                  floaterDarkness: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default VisualSnowSimulator;
