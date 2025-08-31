import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import express from "express";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Your Telegram Bot Token
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

// React App URL
const REACT_APP_URL = "https://visual-snow-simulator.vercel.app"; // <-- Use your deployed React app URL

// /start command sends the Web App button
bot.onText(/\/start/, (msg) => {
    const options = {
        reply_markup: {
            inline_keyboard: [
                [{
                    text: "🚀 Open App in Telegram",
                    web_app: { url: REACT_APP_URL }
                }]
            ]
        }
    };
    bot.sendMessage(msg.chat.id, "Click below to open the app inside Telegram:", options);
});

// Start Express server
app.listen(PORT, () => {
    console.log(`Bot server running on port ${PORT}`);
});
