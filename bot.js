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

const bot = new TelegramBot(TOKEN, { polling: true });

const REACT_APP_URL = "https://visual-snow-simulator.vercel.app";

function introText(user) {
  const name = user?.first_name ? `, ${user.first_name}` : "";
  return (
    `Здравствуйте${name}!\n\n` +
    `Это симулятор визуального снега (VSS). Он поможет наглядно настроить эффекты, похожие на ваши ощущения: «снег» в поле зрения, двоение, ореолы, точки на небе и т.д.\n\n` +
    `Как это работает:\n` +
    `• Внутри приложения вы увидите серию экранов с изображениями.\n` +
    `• На каждом экране вы настроите интенсивность эффекта так, как вы его ощущаете.\n` +
    `• В конце вы сможете сохранить результаты и просмотреть их позже.\n\n` +
    `Важно:\n` +
    `• Это не медицинская диагностика и не лечение.\n` +
    `• Ваши ответы используются только для визуализации и самооценки.\n\n` +
    `Готовы начать?`
  );
}

bot.onText(/\/start/, (msg) => {
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "▶️ Начать симуляцию", web_app: { url: REACT_APP_URL } },
        ],
        [
          {
            text: "📊 Мои прошлые результаты",
            web_app: { url: `${REACT_APP_URL}/previousResults` },
          },
        ],
        [
          { text: "ℹ️ Что это такое?", callback_data: "about_vss" },
        ],
      ],
    },
  };
  bot.sendMessage(msg.chat.id, introText(msg.from), opts);
});

bot.on("callback_query", (q) => {
  if (q.data === "about_vss") {
    const text =
      "Симулятор визуального снега помогает наглядно настроить визуальные эффекты, похожие на ваши ощущения. Это инструмент самооценки, а не медицинская рекомендация. Если симптомы беспокоят, обратитесь к специалисту (офтальмолог/невролог).";
    bot.answerCallbackQuery(q.id);
    bot.sendMessage(q.message.chat.id, text);
  }
});

app.get("/", (_req, res) => res.send("Bot is running"));
app.listen(PORT, () => {
  console.log(`Bot server running on port ${PORT}`);
});
