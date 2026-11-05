
const providerInput = document.getElementById("provider");
const modelInput = document.getElementById("model");
const apiKeyInput = document.getElementById("apiKey");
const messageInput = document.getElementById("messageInput");
const chatForm = document.getElementById("chatForm");
const messagesContainer = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const sendBtn = document.getElementById("sendBtn");
const loadModelsBtn = document.getElementById("loadModelsBtn");

let conversation = [];
let busy = false;

const defaultModels = {
  openai: "gpt-4o-mini",
  openrouter: "openai/gpt-4o-mini"
};

function getProvider() {
  return providerInput.value;
}

function getApiKey() {
  return apiKeyInput.value.trim();
}

function addMessage(role, content) {
  welcome.style.display = "none";

  const message = document.createElement("div");
  message.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "شما" : "AI";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;

  message.appendChild(avatar);
  message.appendChild(bubble);
  messagesContainer.appendChild(message);

  document.getElementById("chatArea").scrollTop =
    document.getElementById("chatArea").scrollHeight;

  return bubble;
}

function setBusy(value) {
  busy = value;
  sendBtn.disabled = value;
  loadModelsBtn.disabled = value;
  sendBtn.textContent = value ? "…" : "➤";
}

async function sendMessage() {
  if (busy) return;

  const text = messageInput.value.trim();
  const apiKey = getApiKey();
  const provider = getProvider();
  const model = modelInput.value.trim();

  if (!text) return;

  if (!apiKey) {
    alert("ابتدا کلید API خود را وارد کن.");
    apiKeyInput.focus();
    return;
  }

  if (!model) {
    alert("نام مدل را وارد کن.");
    modelInput.focus();
    return;
  }

  messageInput.value = "";
  messageInput.style.height = "auto";

  conversation.push({
    role: "user",
    content: text
  });

  addMessage("user", text);

  const assistantBubble = addMessage("assistant", "در حال دریافت پاسخ...");

  setBusy(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        provider,
        apiKey,
        model,
        messages: conversation
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "خطا در ارتباط با سرویس هوش مصنوعی");
    }

    if (!data.reply) {
      throw new Error("پاسخ معتبری از سرویس دریافت نشد.");
    }

    assistantBubble.textContent = data.reply;

    conversation.push({
      role: "assistant",
      content: data.reply
    });

  } catch (error) {
    assistantBubble.textContent = "خطا: " + error.message;

    // پیام ناموفق را وارد سابقه گفت‌وگو نمی‌کنیم.
    conversation.pop();

  } finally {
    setBusy(false);
    messageInput.focus();
  }
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage();
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

messageInput.addEventListener("input", () => {
  messageInput.style.height = "auto";
  messageInput.style.height =
    Math.min(messageInput.scrollHeight, 180) + "px";
});

document.getElementById("newChatBtn").addEventListener("click", () => {
  conversation = [];
  messagesContainer.replaceChildren();
  welcome.style.display = "block";
  messageInput.focus();

  if (window.innerWidth <= 700) {
    document.querySelector(".sidebar").classList.remove("open");
  }
});

document.getElementById("menuBtn").addEventListener("click", () => {
  document.querySelector(".sidebar").classList.toggle("open");
});

document.getElementById("toggleKeyBtn").addEventListener("click", () => {
  const button = document.getElementById("toggleKeyBtn");

  if (apiKeyInput.type === "password") {
    apiKeyInput.type = "text";
    button.textContent = "مخفی";
  } else {
    apiKeyInput.type = "password";
    button.textContent = "نمایش";
  }
});

providerInput.addEventListener("change", () => {
  modelInput.value = defaultModels[getProvider()];
});

document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => {
    messageInput.value = button.dataset.prompt || "";
    messageInput.focus();
  });
});

loadModelsBtn.addEventListener("click", async () => {
  const apiKey = getApiKey();
  const provider = getProvider();

  if (!apiKey) {
    alert("ابتدا کلید API را وارد کن.");
    apiKeyInput.focus();
    return;
  }

  loadModelsBtn.disabled = true;
  loadModelsBtn.textContent = "در حال دریافت...";

  try {
    const response = await fetch("/api/models", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        provider,
        apiKey
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "دریافت مدل‌ها ناموفق بود.");
    }

    const models = data.models || [];

    if (!models.length) {
      throw new Error("مدلی برای نمایش پیدا نشد.");
    }

    const selected = prompt(
      "نام یکی از مدل‌های زیر را وارد کن:\n\n" +
      models.slice(0, 40).join("\n"),
      models[0]
    );

    if (selected && models.includes(selected.trim())) {
      modelInput.value = selected.trim();
    } else if (selected) {
      alert("نام واردشده در فهرست مدل‌ها نیست.");
    }

  } catch (error) {
    alert("خطا: " + error.message);

  } finally {
    loadModelsBtn.disabled = false;
    loadModelsBtn.textContent = "دریافت مدل‌ها";
  }
});
    
