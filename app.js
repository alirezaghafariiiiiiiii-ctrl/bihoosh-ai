const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const micBtn = document.getElementById('mic-btn');
const apiKeyInput = document.getElementById('api-key-input');
const modelSelect = document.getElementById('model-select');
const providerSelect = document.getElementById('provider');

// باز و بسته کردن تنظیمات
function toggleSettings() {
    document.getElementById('settings-panel').classList.toggle('hidden');
}

// ذخیره کلید API در حافظه مرورگر
function saveApiKey() {
    const key = apiKeyInput.value.trim();
    localStorage.setItem('bihoosh_api_key', key);
    loadModels(); // بعد از ذخیره کلید، مدل‌ها را لود کن
}

// بارگذاری مدل‌ها از سرورهای OpenRouter یا Groq
async function loadModels() {
    const provider = providerSelect.value;
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
        modelSelect.innerHTML = '<option value="">ابتدا کلید API را وارد کنید...</option>';
        return;
    }

    modelSelect.innerHTML = '<option value="">در حال دریافت مدل‌ها...</option>';

    try {
        let url, headers = {};
        if (provider === 'openrouter') {
            url = 'https://openrouter.ai/api/v1/models';
            headers = { 'Authorization': `Bearer ${apiKey}` };
        } else {
            url = 'https://api.groq.com/openai/v1/models';
            headers = { 'Authorization': `Bearer ${apiKey}` };
        }

        const res = await fetch(url, { headers });
        const data = await res.json();

        modelSelect.innerHTML = '';
        if (data.data && data.data.length > 0) {
            // مرتب‌سازی مدل‌ها بر اساس حروف الفبا
            data.data.sort((a, b) => a.id.localeCompare(b.id)).forEach(model => {
                const opt = document.createElement('option');
                opt.value = model.id;
                opt.textContent = model.id;
                modelSelect.appendChild(opt);
            });
            // ذخیره آخرین مدل انتخاب شده
            const savedModel = localStorage.getItem(`bihoosh_model_${provider}`);
            if (savedModel) modelSelect.value = savedModel;
        } else {
            modelSelect.innerHTML = '<option value="">مدلی یافت نشد. کلید را چک کنید.</option>';
        }
    } catch (err) {
        modelSelect.innerHTML = '<option value="">خطا در دریافت مدل‌ها</option>';
        console.error(err);
    }
}

// با تغییر سرویس‌دهنده، لیست مدل‌ها آپدیت شود
function onProviderChange() {
    loadModels();
}

// وقتی صفحه لود شد، کلید و تنظیمات قبلی را بازیابی کن
window.onload = () => {
    const savedKey = localStorage.getItem('bihoosh_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
        loadModels();
    }
    
    // ذخیره مدل انتخابی کاربر
    modelSelect.addEventListener('change', () => {
        localStorage.setItem(`bihoosh_model_${providerSelect.value}`, modelSelect.value);
    });
};

// --- بخش صوتی (میکروفون و بلندگو) ---
function startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("مرورگر شما از قابلیت تشخیص صدا پشتیبانی نمی‌کند. از کروم استفاده کنید.");
        return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'fa-IR';
    recognition.interimResults = false;

    recognition.onstart = () => {
        micBtn.classList.add('listening');
        userInput.placeholder = "در حال گوش دادن...";
    };
    
    recognition.onend = () => {
        micBtn.classList.remove('listening');
        userInput.placeholder = "سوال خود را بنویسید...";
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        sendMessage();
    };
    recognition.start();
}

function speak(text) {
    const cleanText = text.replace(/[*#`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fa-IR';
    const voices = window.speechSynthesis.getVoices();
    const faVoice = voices.find(v => v.lang.includes('fa'));
    if (faVoice) utterance.voice = faVoice;
    window.speechSynthesis.speak(utterance);
}

// --- ارسال پیام ---
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    const apiKey = apiKeyInput.value.trim();
    const provider = providerSelect.value;
    const model = modelSelect.value;

    if (!apiKey) {
        alert("لطفاً ابتدا از بخش تنظیمات ⚙️ کلید API خود را وارد کنید.");
        toggleSettings();
        return;
    }
    if (!model) {
        alert("لطفاً یک مدل از لیست انتخاب کنید.");
        toggleSettings();
        return;
    }

    appendMessage('user', message);
    userInput.value = '';

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot';
    loadingDiv.innerText = 'بی‌هوش در حال فکر کردن است...';
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // ارسال کلید و مدل به بک‌اند
            body: JSON.stringify({ message, provider, apiKey, model })
        });
        
        const data = await response.json();
        chatBox.removeChild(loadingDiv);
        
        if (data.reply) {
            appendMessage('bot', data.reply);
            speak(data.reply);
        } else {
            appendMessage('bot', 'خطا: ' + (data.error || 'مشکلی پیش آمد'));
        }
    } catch (err) {
        chatBox.removeChild(loadingDiv);
        appendMessage('bot', 'ارتباط با سرور برقرار نشد.');
    }
}

function appendMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.innerText = text; 
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

document.body.addEventListener('click', () => {
    window.speechSynthesis.getVoices();
}, { once: true });
