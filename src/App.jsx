import React, { useEffect, useState } from "react";
import VisualSnowSimulator from "../src/components/VisualSnowSimulator.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState(0);
  const [loginForm, setLoginForm] = useState({
    first_name: "",
    last_name: "",
    telegram: "",
  });

  // Accumulate effect values here
  const [effectsData, setEffectsData] = useState({});

  const sheetsUrl =
    "https://script.google.com/macros/s/AKfycby2Q_ip92EafnDS3zhiiprMU_o1RBGVbtI109Acc28lTpVEeCFK1jP9vxexqGChYAs/exec";

  const screens = [
    { image: "/room_dark.png", effect: "blur" },
    { image: "/room_light.png", effect: "noise" },
    { image: "/bar.png", effect: "ghost" },
    { image: "/lamps.png", effect: "halo" },
    { image: "/sky.png", effect: "blueField" },
    { image: "/sky.png", effect: "floaters" },
  ];

  // Telegram theme hookup
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    const applyTheme = () => {
      const p = tg.themeParams || {};
      const set = (k, v) =>
        v && document.documentElement.style.setProperty(k, `#${v}`);
      set("--tg-theme-bg-color", p.bg_color);
      set("--tg-theme-text-color", p.text_color);
      set("--tg-theme-hint-color", p.hint_color);
      set("--tg-theme-link-color", p.link_color);
      set("--tg-theme-button-color", p.button_color);
      set("--tg-theme-button-text-color", p.button_text_color);
      set("--tg-theme-secondary-bg-color", p.secondary_bg_color);
      document.documentElement.classList.toggle("dark", tg.colorScheme === "dark");
    };
    applyTheme();
    tg.onEvent("themeChanged", applyTheme);
    tg.expand();
    return () => tg.offEvent?.("themeChanged", applyTheme);
  }, []);

  const onNextScreenButton = () =>
    setCurrentScreen((prev) => (prev + 1) % screens.length);

  const handleInputChange = (e) =>
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });

  const handleLogin = (e) => {
    e.preventDefault();
    setUser({
      first_name: loginForm.first_name,
      last_name: loginForm.last_name,
      telegram: loginForm.telegram,
    });
  };

  // Collect values from simulator
  const handleEffectSnapshot = ({ effectType, values }) => {
    setEffectsData((prev) => ({
      ...prev,
      [effectType]: {
        ...(prev[effectType] || {}),
        ...values,
        image: screens.find((s) => s.effect === effectType)?.image,
      },
    }));
  };

  const handleFinishTesting = async () => {
    const payload = {
      first_name: user.first_name,
      last_name: user.last_name,
      telegram: user.telegram,
      finishedAt: new Date().toISOString(),
      screens: screens.map((s, idx) => ({
        index: idx,
        image: s.image,
        effect: s.effect,
        values: effectsData[s.effect] || null,
      })),
      effectsByType: effectsData,
    };

    try {
      const res = await fetch(sheetsUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      alert("Результаты отправлены. Спасибо!");
    } catch (err) {
      alert("Ошибка отправки: " + err.message);
    } finally {
      setUser(null);
      setCurrentScreen(0);
      setEffectsData({});
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)]">
      {user ? (
        <>
          <p className="mb-4 text-lg font-semibold">
            Привет, {user.first_name}! 👋
          </p>

          <VisualSnowSimulator
            image={screens[currentScreen].image}
            effectType={screens[currentScreen].effect}
            onEffectSnapshot={handleEffectSnapshot}
          />

          {currentScreen < screens.length - 1 ? (
            <button
              onClick={onNextScreenButton}
              className="tg-btn mt-4 px-4 py-2 shadow-md"
            >
              Следующий экран
            </button>
          ) : (
            <button
              onClick={handleFinishTesting}
              className="tg-btn mt-4 px-4 py-2 shadow-md"
            >
              Завершить тест
            </button>
          )}
        </>
      ) : (
        <form
          onSubmit={handleLogin}
          className="tg-card p-6 flex flex-col gap-4 w-80"
        >
          <h2 className="text-2xl font-bold mb-4 text-center">
            Тест на визуальный снег (VSS)
          </h2>

          <input
            type="text"
            name="first_name"
            placeholder="Имя"
            value={loginForm.first_name}
            onChange={handleInputChange}
            className="tg-input w-full"
            required
          />
          <input
            type="text"
            name="last_name"
            placeholder="Фамилия"
            value={loginForm.last_name}
            onChange={handleInputChange}
            className="tg-input w-full"
            required
          />
          <input
            type="text"
            name="telegram"
            placeholder="Telegram (@username)"
            value={loginForm.telegram}
            onChange={handleInputChange}
            className="tg-input w-full"
            required
          />

          <button type="submit" className="tg-btn w-full">
            Начать тест
          </button>
        </form>
      )}
    </div>
  );
}

export default App;
