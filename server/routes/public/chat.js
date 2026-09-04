const express = require("express");
const { chatLimiter } = require("../../middleware/rateLimit");
const chatbot = require("../../services/chatbot");

const router = express.Router();

router.post("/api/chat", chatLimiter, async (req, res) => {
  const messages = Array.isArray(req.body.messages) ? req.body.messages : [];
  const valid = messages.every(
    (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
  );

  if (!valid || messages.length === 0 || messages.length > 40) {
    return res.status(422).json({ error: { message: "Invalid message payload.", code: "VALIDATION" } });
  }

  try {
    const { reply } = await chatbot.sendMessage(messages, { sourcePage: req.get("referer") || null });
    res.json({ reply });
  } catch (err) {
    console.error("[chat] Failed to get a response:", err.message);
    res.status(502).json({ error: { message: "The chat assistant is temporarily unavailable.", code: "CHAT_ERROR" } });
  }
});

module.exports = router;
