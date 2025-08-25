import React, { useEffect, useState } from "react";
import VisualSnowSimulator from "../src/components/VisualSnowSimulator.jsx";

// curl -s -X POST \
//   -H "Content-Type: text/plain" \
//     -d '{"first_name":"John","last_name":"Doe","telegram":"@johndoe","finishedAt":"2025-08-24T23:59:00Z"}' \  "https://script.google.com/macros/s/AKfycbyXP0Rt6QgMH_Qi0YbBruvA0NSUgf8_mN_MC_BCcaHTa8N3tU1xgFuSsZcuctnhw3a7/exec"

function App() {
  const [user, setUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState(0);
  const [loginForm, setLoginForm] = useState({
    first_name: "",
    last_name: "",
    telegram: "",
  });

  const sheetsUrl =
    "https://script.google.com/macros/s/AKfycbyXP0Rt6QgMH_Qi0YbBruvA0NSUgf8_mN_MC_BCcaHTa8N3tU1xgFuSsZcuctnhw3a7/exec";

  const screens = [
    { image: "/sky.png", effect: "blur" },
    { image: "/room.png", effect: "noise" },
    { image: "/bar.png", effect: "ghost" },
    { image: "/lamps.png", effect: "halo" },
    { image: "/sky.png", effect: "blueField" },
  ];

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand();
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }
    }
  }, []);

  const onNextScreenButton = () => {
    setCurrentScreen((prevScreen) => (prevScreen + 1) % screens.length);
  };

  const handleInputChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setUser({
      first_name: loginForm.first_name,
      last_name: loginForm.last_name,
      telegram: loginForm.telegram,
    });
  };

  const handleFinishTesting = async () => {
    try {
      const res = await fetch(sheetsUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // <-- key change
        body: JSON.stringify({
          first_name: user.first_name,
          last_name: user.last_name,
          telegram: user.telegram,
          finishedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      alert("Error submitting results: " + err.message);
    } finally {
      setUser(null);
      setCurrentScreen(0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      {user ? (
        <>
          <p className="mb-4 text-lg font-semibold">
            Welcome, {user.first_name}! 👋
          </p>
          <VisualSnowSimulator
            image={screens[currentScreen].image}
            effectType={screens[currentScreen].effect}
          />
          {currentScreen < screens.length - 1 ? (
            <button
              onClick={onNextScreenButton}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600"
            >
              Next screen
            </button>
          ) : (
            <button
              onClick={handleFinishTesting}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600"
            >
              Finish testing
            </button>
          )}
        </>
      ) : (
        <form
          onSubmit={handleLogin}
          className="bg-white p-6 rounded-lg shadow-md flex flex-col gap-4 w-80"
        >
          <h2 className="text-xl font-bold mb-2">Vss testing</h2>
          <input
            type="text"
            name="first_name"
            placeholder="First Name"
            value={loginForm.first_name}
            onChange={handleInputChange}
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="text"
            name="last_name"
            placeholder="Last Name"
            value={loginForm.last_name}
            onChange={handleInputChange}
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="text"
            name="telegram"
            placeholder="Telegram Username"
            value={loginForm.telegram}
            onChange={handleInputChange}
            className="border rounded px-3 py-2"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600"
          >
            Start testing
          </button>
        </form>
      )}
    </div>
  );
}

export default App;
