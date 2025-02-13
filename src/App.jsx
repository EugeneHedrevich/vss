import React, { useEffect, useState } from "react";
import VisualSnowSimulator from "../src/components/VisualSnowSimulator.jsx";

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.expand(); // Expands the app inside Telegram

            // Get Telegram user data
            if (tg.initDataUnsafe?.user) {
                setUser(tg.initDataUnsafe.user);
            }
        }
    }, []);

    const sendMessageToBot = () => {
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.sendData("User interacted with Visual Snow Simulator!");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            {/* User Info Display */}
            {user ? (
                <p className="mb-4 text-lg font-semibold">
                    Welcome, {user.first_name}! 👋
                </p>
            ) : (
                <p className="mb-4 text-lg font-semibold">Loading user info...</p>
            )}

            {/* Visual Snow Simulator Component */}
            <VisualSnowSimulator />

            {/* Send Data Button */}
            <button
                onClick={sendMessageToBot}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600"
            >
                Send Data to Telegram Bot
            </button>
        </div>
    );
}

export default App;
