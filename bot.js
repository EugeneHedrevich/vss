require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// Your Telegram Bot Token
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

// React App URL
const REACT_APP_URL = "https://vercel.com/yauhen-hedrevichs-projects/visual-snow-simulator/ArzDNyZAMNXrA18WYj4Rr6RkA2A2/source?f=src%2Fimages%2Fimage.png"; // Change to your deployed React app

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
