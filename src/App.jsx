import React, { useEffect, useState } from "react";
import VisualSnowSimulator from "../src/components/VisualSnowSimulator.jsx";

function App() {
    const [user, setUser] = useState(null);
    const [currentScreen, setCurrentScreen] = useState(0);

    const screens = [
        { image: "/sky.png", effect: "blur" },  // First image uses blur
        { image: "/room.png", effect: "noise" }, // Second image uses noise
        { image: "/bar.png", effect: "ghost" }, // Third image uses ghost effect
        { image: "/lamps.png", effect: "halo" }, // Third image uses ghost effect
    ];


    useEffect(() => {
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.expand(); // Expands the app inside Telegram

            if (tg.initDataUnsafe?.user) {
                setUser(tg.initDataUnsafe.user);
            }
        }
    }, []);

    const onNextScreenButton = () => {
        setCurrentScreen((prevScreen) => (prevScreen + 1) % screens.length);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            {user ? (
                <p className="mb-4 text-lg font-semibold">
                    Welcome, {user.first_name}! 👋
                </p>
            ) : (
                <p className="mb-4 text-lg font-semibold">Loading user info...</p>
            )}

            {/* Pass correct image and effectType from screens array */}
            <VisualSnowSimulator
                image={screens[currentScreen].image}
                effectType={screens[currentScreen].effect}
            />

            <button
                onClick={onNextScreenButton}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600"
            >
                Next screen
            </button>
        </div>
    );
}

export default App;
