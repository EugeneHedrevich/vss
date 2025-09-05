import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import express from "express";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN in env");
}

const bot = new TelegramBot(TOKEN, {polling: true});

// Your deployed React app URL (HTTPS!)
const REACT_APP_URL = "https://visual-snow-simulator.vercel.app";

// /start command -> WebApp button (DO NOT use plain `url:` button)
bot.onText(/\/start/, (msg) => {
    const opts = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "🚀 Open App in Telegram",
                        web_app: {url: REACT_APP_URL},
                    },
                    {
                        text: "📊 Мои прошлые результаты",
                        web_app: { url: `${REACT_APP_URL}/previousResults` },
                    },
                ],
            ],
        },
    };
    bot.sendMessage(
        msg.chat.id,
        "Click below to open the app inside Telegram:",
        opts
    );
});
// Keep the tiny Express server alive (for hosting pings)
app.get("/", (_req, res) => res.send("Bot is running"));
app.listen(PORT, () => {
    console.log(`Bot server running on port ${PORT}`);
});
