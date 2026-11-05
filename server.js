const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// سیستم پرامپت (شخصیت کدنویس بیهوشه)
const SYSTEM_PROMPT = `شما "بیهوشه" هستید، یک دستیار برنامه‌نویس بسیار باهوش، کمی طنز و کاملاً حرفه‌ای. 
شما به زبان فارسی صحبت می‌کنید، اما کدها را به زبان انگلیسی و با فرمت تمیز می‌نویسید. 
همیشه سعی کنید کدهای بهینه، امن و مدرن ارائه دهید و پاسخ‌ها را برای شنیدن (توسط تبدیل متن به گفتار) کوتاه و مفید نگه دارید.`;

app.post('/api/chat', async (req, res) => {
    const { message, provider, apiKey } = req.body; // apiKey از سمت کاربر میاد (اختیاری) یا از .env خوانده میشه
    
    try {
        let url, headers, model;

        if (provider === 'openrouter') {
            url = 'https://openrouter.ai/api/v1/chat/completions';
            model = 'openai/gpt-4o-mini'; // یا هر مدل دیگری در اوپن‌روتر
            headers = {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/alirezaghafariiiiiiii-ctrl/Bihooshe', // آدرس ریپازیتوری شما
                'X-Title': 'Bihooshe AI'
            };
        } else if (provider === 'groq') {
            url = 'https://api.groq.com/openai/v1/chat/completions';
            model = 'llama3-8b-8192'; // یا mixtral-8x7b-32768
            headers = {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY || apiKey}`,
                'Content-Type': 'application/json'
            };
        }

        const response = await axios.post(url, {
            model: model,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: message }
            ]
        }, { headers });

        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'خطا در ارتباط با سرور هوش مصنوعی' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`بیهوشه روی پورت ${PORT} بیدار شد!`));
