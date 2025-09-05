// src/utils/telegramProfile.js

const getTG = () => window.Telegram?.WebApp;

// --- CloudStorage helpers ---
const cloudGet = (key) =>
    new Promise((resolve) => {
        const tg = getTG();
        if (!tg?.CloudStorage) return resolve(null);
        tg.CloudStorage.getItem(key, (val, err) => resolve(err ? null : val));
    });

const cloudSet = (key, value) =>
    new Promise((resolve) => {
        const tg = getTG();
        if (!tg?.CloudStorage) return resolve(false);
        tg.CloudStorage.setItem(key, value, (ok, err) => resolve(!err && ok));
    });

const cloudRemove = (key) =>
    new Promise((resolve) => {
        const tg = getTG();
        if (!tg?.CloudStorage?.removeItem) return resolve(false);
        tg.CloudStorage.removeItem(key, (ok, err) => resolve(!err && ok));
    });

// --- Public API ---

/**
 * Prefill login form:
 * 1. Try saved profile from CloudStorage
 * 2. Else try Telegram initDataUnsafe.user
 * 3. Else try sessionStorage
 */
export async function loadProfile() {
    // CloudStorage first
    const saved = await cloudGet("profile");
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch {}
    }

    // Telegram initDataUnsafe.user
    const tg = getTG();
    const u = tg?.initDataUnsafe?.user;
    if (u) {
        return {
            first_name: u.first_name || "",
            last_name: u.last_name || "",
            telegram: u.username ? `@${u.username}` : "",
        };
    }

    // sessionStorage fallback
    const cached = sessionStorage.getItem("profile");
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch {}
    }

    return null;
}