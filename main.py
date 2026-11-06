import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
API_KEY = os.environ.get("OPENROUTER_API_KEY", "")

app = FastAPI(title="AI Host")


class ChatRequest(BaseModel):
    messages: list[dict]  # [{"role": "user", "content": "سلام"}]
    model: str = "openai/gpt-4o-mini"
    stream: bool = False


def headers():
    if not API_KEY:
        raise HTTPException(500, "OPENROUTER_API_KEY تنظیم نشده")
    return {"Authorization": f"Bearer {API_KEY}"}


@app.post("/chat")
async def chat(req: ChatRequest):
    payload = req.model_dump()

    if req.stream:
        async def gen():
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream(
                    "POST", OPENROUTER_URL, json=payload, headers=headers()
                ) as r:
                    async for chunk in r.aiter_raw():
                        yield chunk

        return StreamingResponse(gen(), media_type="text/event-stream")

    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(OPENROUTER_URL, json=payload, headers=headers())
    if r.status_code != 200:
        raise HTTPException(r.status_code, r.text)
    return r.json()


@app.get("/health")
async def health():
    return {"ok": True}

# اجرا:
#   pip install fastapi uvicorn httpx
#   export OPENROUTER_API_KEY=sk-or-...
#   uvicorn main:app --host 0.0.0.0 --port 8000
