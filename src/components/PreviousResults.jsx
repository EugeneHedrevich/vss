import React, { useEffect, useMemo, useState } from "react";
import { loadHistory } from "../utils/historyStore";

const EFFECT_NAME = {
  blur: "Размытие",
  noise: "Шум",
  ghost: "Двоение",
  halo: "Ореол",
  blueField: "Эффект голубого поля",
  floaters: "Мутные тела («мушки»)",
};

const VALUE_LABEL = {
  blurLevel: "Уровень размытия",
  noiseLevel: "Уровень шума",
  opacityLevel: "Прозрачность двоения",
  ghostX: "Смещение X",
  ghostY: "Смещение Y",
  haloIntensity: "Интенсивность ореола",
  haloOpacity: "Прозрачность ореола",
  haloDiameter: "Диаметр ореола",
  positions: "Количество ореолов",
  numSquigglies: "Количество точек",
  blueOpacity: "Прозрачность",
  floaterCount: "Количество",
  floaterTail: "Длина хвоста",
  floaterOpacity: "Прозрачность",
  floaterDarkness: "Темнота",
};

const isUnitPercent = new Set([
  "opacityLevel",
  "haloIntensity",
  "haloOpacity",
  "blueOpacity",
  "floaterOpacity",
  "floaterDarkness",
]);

function pct(v) {
  if (typeof v !== "number") return v;
  return `${Math.round(v * 100)}%`;
}

function fileNameFromPath(p) {
  if (!p) return "";
  const parts = p.split("/");
  return parts[parts.length - 1];
}

function normalizeValues(effect, values = {}) {
  const out = { ...values };
  if (Array.isArray(out.positions)) out.positions = out.positions.length;
  return out;
}

function ValueChips({ effect, values }) {
  const v = normalizeValues(effect, values);
  const entries = Object.entries(v)
    .filter(([k]) => k !== "image")
    .map(([k, val]) => {
      const label = VALUE_LABEL[k] || k;
      const shown =
        isUnitPercent.has(k) && typeof val === "number" ? pct(val) : String(val);
      return (
        <span
          key={k}
          className="inline-flex items-center rounded-full px-2 py-1 text-xs border gap-1"
        >
          <span className="opacity-70">{label}:</span>
          <span className="font-medium">{shown}</span>
        </span>
      );
    });

  if (!entries.length)
    return <span className="text-xs text-gray-400">Без параметров</span>;
  return <div className="flex flex-wrap gap-2">{entries}</div>;
}

function ResultCard({ s }) {
  const friendlyName = EFFECT_NAME[s.effect] || s.effect;
  const pictureName = fileNameFromPath(s.image);
  return (
    <div className="rounded-2xl border shadow-sm p-3 sm:p-4 bg-white">
      <div className="flex items-start gap-3">
        <div className="w-20 h-20 rounded-xl overflow-hidden border bg-gray-50 shrink-0">
          {s.image ? (
            <img
              src={s.image}
              alt={friendlyName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold truncate">
              {friendlyName}
            </h3>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100">{`#${
              s.index + 1
            }`}</span>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Картинка: <span className="font-medium">{pictureName || "—"}</span>
          </div>
          <div className="mt-2">
            <ValueChips effect={s.effect} values={s.values} />
          </div>
        </div>
      </div>
    </div>
  );
}

function RunSection({ run }) {
  const screens = useMemo(
    () =>
      run?.screens ? [...run.screens].sort((a, b) => a.index - b.index) : [],
    [run]
  );
  const finishedAt = new Date(run.finishedAt);
  return (
    <section className="rounded-2xl border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm text-gray-700">
          <span className="mr-3">
            Имя: <b>{run.first_name} {run.last_name}</b>
          </span>
          <span className="mr-3">
            Telegram: <b>{run.telegram}</b>
          </span>
        </div>
        <div className="text-sm text-gray-700">
          Дата:{" "}
          <b>{finishedAt.toLocaleString("ru-RU", { hour12: false })}</b>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {screens.map((s) => (
          <ResultCard key={s.index} s={s} />
        ))}
      </div>
    </section>
  );
}

export default function PreviousResults() {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory((_e, hist) => {
      setHistory(hist);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="p-6">Загрузка…</p>;
  if (!history || history.length === 0)
    return <p className="p-6">Нет сохранённых результатов.</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold">Прошлые результаты</h2>
      <div className="mt-4 space-y-4">
        {history.map((run, i) => (
          <RunSection key={`${run.finishedAt}-${i}`} run={run} />
        ))}
      </div>
    </div>
  );
}
