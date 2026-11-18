// server/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const LOGS_CHAT_ID = process.env.CHAT_ID_LOGS;
const ACTIONS_CHAT_ID = process.env.CHAT_ID_ACTIONS;

// Core sender
const sendToTelegram = async (chatId, text, replyMarkup = null) => {
  if (!TOKEN) throw new Error("Missing TELEGRAM_BOT_TOKEN in .env");
  const body = { chat_id: chatId, text, parse_mode: "HTML" };
  if (replyMarkup) body.reply_markup = replyMarkup;

  const tg = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return tg.json();
};

// Route for simple logs (goes to LOGS_CHAT_ID)
app.post("/api/log", async (req, res) => {
  try {
    await sendToTelegram(LOGS_CHAT_ID, req.body.text);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Route for interactive actions (goes to ACTIONS_CHAT_ID)
app.post("/api/action", async (req, res) => {
  try {
    await sendToTelegram(ACTIONS_CHAT_ID, req.body.text, req.body.keyboard);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Polling endpoint for frontend (keeps buttons working)
app.get("/api/updates", async (req, res) => {
  try {
    const offset = req.query.offset || 0;
    const tg = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=5`);
    res.json(await tg.json());
  } catch (e) { res.status(500).json({ ok: false }); }
});

// Callback answer endpoint
app.post("/api/callback", async (req, res) => {
  try {
    const { callback_query_id, text } = req.body;
    await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ callback_query_id, text }),
    });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false }); }
});

app.listen(3001, () => console.log("notify on :3001"));