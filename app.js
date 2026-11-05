const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const micBtn = document.getElementById('mic-btn');

// تابع گفتار به متن (میکروفون)
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

// تابع متن به گفتار (بلندگو)
function speak(text) {
    // پاک کردن کاراکترهای مارک‌داون برای خواندن بهتر
    const cleanText = text.replace(/[*#`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fa-IR';
    
    // تلاش برای پیدا کردن صدای فارسی در گوشی
    const voices = window.speechSynthesis.getVoices();
    const faVoice = voices.find(v => v.lang.includes('fa'));
    if (faVoice) utterance.voice = faVoice;

    window.speechSynthesis.speak(utterance);
}

// ارسال پیام
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    appendMessage('user', message);
    userInput.value = '';

    const provider = document.getElementById('provider').value;

    // نمایش پیام "در حال تایپ..."
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot';
    loadingDiv.innerText = 'بی‌هوش در حال فکر کردن است...';
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, provider })
        });
        
        const data = await response.json();
        chatBox.removeChild(loadingDiv); // حذف پیام لودینگ
        
        if (data.reply) {
            appendMessage('bot', data.reply);
            speak(data.reply); // بیهوشه جواب رو میخونه!
        } else {
            appendMessage('bot', 'خطا: ' + data.error);
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

// فعال کردن صدا در بعضی مرورگرها (مثل iOS)
document.body.addEventListener('click', () => {
    window.speechSynthesis.getVoices();
}, { once: true });
