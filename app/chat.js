
const PROVIDERS = {
  openai: {
    url: "https://api.openai.com/v1/chat/completions"
  },
  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions"
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "متد درخواست مجاز نیست."
    });
  }

  try {
    const {
      provider,
      apiKey,
      model,
      messages
    } = req.body || {};

    const selectedProvider = PROVIDERS[provider];

    if (!selectedProvider) {
      return res.status(400).json({
        error: "سرویس انتخاب‌شده معتبر نیست."
      });
    }

    if (
      typeof apiKey !== "string" ||
      apiKey.length < 10 ||
      apiKey.length > 500
    ) {
      return res.status(400).json({
        error: "کلید API معتبر نیست."
      });
    }

    if (
      typeof model !== "string" ||
      !model.trim() ||
      model.length > 200
    ) {
      return res.status(400).json({
        error: "نام مدل معتبر نیست."
      });
    }

    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.length > 40
    ) {
      return res.status(400).json({
        error: "ساختار پیام‌ها معتبر نیست."
      });
    }

    const allowedRoles = new Set(["user", "assistant"]);

    const safeMessages = [];

    for (const message of messages) {
      if (
        !message ||
        !allowedRoles.has(message.role) ||
        typeof message.content !== "string" ||
        !message.content.trim() ||
        message.content.length > 12000
      ) {
        return res.status(400).json({
          error: "یکی از پیام‌ها ساختار نامعتبر دارد."
        });
      }

      safeMessages.push({
        role: message.role,
        content: message.content
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    let upstream;

    try {
      const headers = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      };

      if (provider === "openrouter") {
        headers["HTTP-Referer"] =
          process.env.APP_URL || "https://example.com";

        headers["X-Title"] = "Bihoosh AI";
      }

      upstream = await fetch(selectedProvider.url, {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model: model.trim(),
          messages: safeMessages,
          temperature: 0.7
        })
      });

    } finally {
      clearTimeout(timeout);
    }

    const result = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      const providerMessage =
        result?.error?.message ||
        result?.message ||
        "سرویس هوش مصنوعی درخواست را نپذیرفت.";

      return res.status(
        upstream.status >= 400 && upstream.status < 600
          ? upstream.status
          : 502
      ).json({
        error: providerMessage
      });
    }

    const reply = result?.choices?.[0]?.message?.content;

    if (typeof reply !== "string" || !reply.trim()) {
      return res.status(502).json({
        error: "پاسخ دریافتی از سرویس خالی یا نامعتبر است."
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("Chat API error:", error.name || "UnknownError");

    if (error.name === "AbortError") {
      return res.status(504).json({
        error: "زمان انتظار برای پاسخ تمام شد. دوباره تلاش کن."
      });
    }

    return res.status(500).json({
      error: "خطای داخلی سرور رخ داده است."
    });
  }
}
