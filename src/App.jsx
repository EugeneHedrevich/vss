import { useEffect, useState } from "react";
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
    "https://script.google.com/macros/s/AKfycbxQDh8QTu4kHTWLFwgyjrrvu3O0fSHULo5ppHhjcFj5qqkDg6ECSRiG6Taj-uN_aWow/exec";

  const screens = [
    { image: "/room_dark_ai.png", effect: "blur" },
    { image: "/room_light_ai.png", effect: "noise" },
    { image: "/bar_ai.png", effect: "ghost" },
    { image: "/lamps.png", effect: "halo" },
    { image: "/sky_ai.png", effect: "blueField" },
    { image: "/sky_son_ai.png", effect: "floaters" },
  ];

  // Telegram theme hookup
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    console.log("Telegram WebApp object:", tg);
window.Telegram?.WebApp
    if (!tg) return;

    tg.expand();

    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
      console.log("Telegram user info:", tg.initDataUnsafe.user);
      setUser({
        first_name: tg.initDataUnsafe.user.first_name || "",
        last_name: tg.initDataUnsafe.user.last_name || "",
        telegram: tg.initDataUnsafe.user.username || "",
        id: tg.initDataUnsafe.user.id || "",
      });
    } else {
      console.log("No Telegram user info found.");
    }
  }, []);

  const onNextScreenButton = () =>
    setCurrentScreen((prev) => (prev + 1) % screens.length);

  const onPrevScreenButton = () =>
    setCurrentScreen((prev) => (prev > 0 ? prev - 1 : prev));

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

  const [busy, setBusy] = useState(false);

  const handleFinishTesting = async () => {
    setBusy(true);
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
      setBusy(false);
      setUser(null);
      setCurrentScreen(0);
      setEffectsData({});
      setLoginForm({ first_name: "", last_name: "", telegram: "" }); // clean data
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

          {/* Page indicator */}
          <div className="mt-2 text-center text-sm text-gray-500">
            {currentScreen + 1} / {screens.length}
          </div>

          {busy && (
            <div className="mt-4 text-center text-blue-600 font-semibold">
              Отправка результатов...
            </div>
          )}

          <div className="flex gap-4 mt-4">
            {currentScreen > 0 ? (
              <button
                onClick={onPrevScreenButton}
                className="tg-btn px-4 py-2 shadow-md"
                disabled={busy}
              >
                Назад
              </button>
            ) : (
              <button
                onClick={() => {
                  // Go back to login to change initial data
                  setUser(null);
                  setCurrentScreen(0);
                  setEffectsData({});
                }}
                className="tg-btn px-4 py-2 shadow-md"
                disabled={busy}
              >
                Назад к данным
              </button>
            )}
            {currentScreen < screens.length - 1 ? (
              <button
                onClick={onNextScreenButton}
                className="tg-btn px-4 py-2 shadow-md"
                disabled={busy}
              >
                Следующий экран
              </button>
            ) : (
              <button
                onClick={handleFinishTesting}
                className="tg-btn px-4 py-2 shadow-md"
                disabled={busy}
              >
                Завершить тест
              </button>
            )}
          </div>
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
