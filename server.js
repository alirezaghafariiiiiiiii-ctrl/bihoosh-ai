const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const SYSTEM_PROMPT = `شما "بی‌هوش" (Bihoosh) هستید، یک دستیار مستقل و متخصص در توسعه بازی (Game Development). 
شما به زبان فارسی صحبت می‌کنید، اما کدها را به زبان انگلیسی و با فرمت تمیز می‌نویسید. 
تخصص شما در موتورهای بازی‌سازی مانند Unity (C#)، Unreal Engine (C++) و Godot است.
پاسخ‌های متنی خود را برای شنیدن (توسط تبدیل متن به گفتار) کوتاه، مفید و صمیمی نگه دارید.`;

app.post('/api/chat', async (req, res) => {
    // دریافت کلید و مدل از سمت کاربر (فرانت‌اند)
    const { message, provider, apiKey, model } = req.body;
    
    try {
        let url, headers, finalModel;

        if (provider === 'openrouter') {
            url = 'https://openrouter.ai/api/v1/chat/completions';
            finalModel = model || 'openai/gpt-4o-mini'; // اگر مدل انتخاب نشد، پیش‌فرض
            headers = {
                'Authorization': `Bearer ${apiKey || process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/alirezaghafariiiiiiii-ctrl/bihoosh-ai',
                'X-Title': 'Bihoosh AI'
            };
        } else if (provider === 'groq') {
            url = 'https://api.groq.com/openai/v1/chat/completions';
            finalModel = model || 'llama3-8b-8192';
            headers = {
                'Authorization': `Bearer ${apiKey || process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            };
        }

        const response = await axios.post(url, {
            model: finalModel,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: message }
            ]
        }, { headers });

        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'خطا در ارتباط با سرور هوش مصنوعی. کلید API یا مدل را بررسی کنید.' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`بیهوشه روی پورت ${PORT} بیدار شد!`));
}
module.exports = app;
