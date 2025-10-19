export const HISTORY_KEY = "resultsHistory";
export const LAST_KEY = "lastResult";
export const HISTORY_LIMIT = 20;

function getTG() {
  return window.Telegram?.WebApp?.CloudStorage;
}

export function loadHistory(cb) {
  const cs = getTG();
  if (!cs?.getItem) return cb(null, []);
  cs.getItem(HISTORY_KEY, (_err, val) => {
    if (!val) return cb(null, []);
    try {
      const arr = JSON.parse(val);
      cb(null, Array.isArray(arr) ? arr : []);
    } catch {
      cb(null, []);
    }
  });
}

export function saveHistory(history, cb) {
  const cs = getTG();
  if (!cs?.setItem) return cb && cb(new Error("CloudStorage not available"));
  try {
    const trimmed = history.slice(0, HISTORY_LIMIT);
    cs.setItem(HISTORY_KEY, JSON.stringify(trimmed), () => cb && cb(null));
  } catch (e) {
    cb && cb(e);
  }
}

/** Append one result, keeping newest-first and limit */
export function appendResult(result, cb) {
  loadHistory((_e, hist) => {
    const next = [result, ...hist].slice(0, HISTORY_LIMIT);
    saveHistory(next, cb);
  });
}
