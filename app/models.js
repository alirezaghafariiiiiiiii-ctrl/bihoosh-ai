
const PROVIDERS = {
  openai: "https://api.openai.com/v1/models",
  openrouter: "https://openrouter.ai/api/v1/models"
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      error: "متد درخواست مجاز نیست."
    });
  }

  try {
    const { provider, apiKey } = req.body || {};

    const url = PROVIDERS[provider];

    if (!url) {
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response;

    try {
      const headers = {
        "Authorization": `Bearer ${apiKey}`
      };

      if (provider === "openrouter") {
        headers["X-Title"] = "Bihoosh AI";
        headers["HTTP-Referer"] =
          process.env.APP_URL || "https://example.com";
      }

      response = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal
      });

    } finally {
      clearTimeout(timeout);
    }

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          result?.error?.message ||
          "دریافت فهرست مدل‌ها از سرویس ناموفق بود."
      });
    }

    const models = Array.isArray(result.data)
      ? result.data
          .map((item) => item.id)
          .filter(
            (id) =>
              typeof id === "string" &&
              id.length > 0 &&
              id.length <= 200
          )
          .sort()
      : [];

    return res.status(200).json({
      models
    });

  } catch (error) {
    console.error("Models API error:", error.name || "UnknownError");

    if (error.name === "AbortError") {
      return res.status(504).json({
        error: "زمان دریافت فهرست مدل‌ها تمام شد."
      });
    }

    return res.status(500).json({
      error: "خطای داخلی هنگام دریافت مدل‌ها."
    });
  }
}
