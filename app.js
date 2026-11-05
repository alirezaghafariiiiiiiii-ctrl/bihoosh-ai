const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');

// سیستم تبدیل متن به گفتار (TTS)
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fa-IR'; // زبان فارسی
    window.speechSynthesis.speak(utterance);
}

// سیستم تبدیل گفتار به متن (STT)
function startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("مرورگر شما از قابلیت تشخیص صدا پشتیبانی نمی‌کند. از کروم استفاده کنید.");
        return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'fa-IR';
    recognition.interimResults = false;

    recognition.onstart = () => document.getElementById('mic-btn').style.background = 'red';
    recognition.onend = () => document.getElementById('mic-btn').style.background = '';
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        sendMessage();
    };
    recognition.start();
}

// ارسال پیام به بک‌اند
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    appendMessage('user', message);
    userInput.value = '';

    const provider = document.getElementById('provider').value;

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, provider })
        });
        
        const data = await response.json();
        if (data.reply) {
            appendMessage('bot', data.reply);
            speak(data.reply); // بیهوشه جوابت رو میخونه!
        } else {
            appendMessage('bot', data.error);
        }
    } catch (err) {
        appendMessage('bot', 'ارتباط با سرور برقرار نشد.');
    }
}

function appendMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    // تبدیل مارک‌داون به کد (نیاز به کتابخانه مارک‌داون دارد اما برای سادگی فعلاً متن میگذاریم)
    div.innerText = text; 
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
      }
