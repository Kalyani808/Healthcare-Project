import os
import json
import logging
import urllib.request
import time
from decouple import config

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = config("OLLAMA_BASE_URL", default="http://localhost:11434")
OLLAMA_CHAT_MODEL = config("OLLAMA_CHAT_MODEL", default="mistral")
OPENROUTER_API_KEY = config("OPENROUTER_API_KEY", default="")
PREFER_CLOUD_OCR = config("PREFER_CLOUD_OCR", default="false").lower() == "true"

SYSTEM_PROMPT = """You are SevaHealth AI Sahayak, an empathetic, supportive healthcare companion for rural patients and families in India.

CRITICAL INSTRUCTIONS & GUARDRAILS:
1. LANGUAGE: Respond in the EXACT same language as the patient's message (Hindi if written in Hindi/Hinglish, English if written in English, Telugu if in Telugu, Marathi if in Marathi).
2. TONE & STYLE: Be warm, simple, concise, and clear. Avoid complex medical jargon. Keep advice practical and easy for a rural family to follow.
3. SCOPE & SAFETY:
   - Provide general health advice, home remedies, hydration guidance, and preventative tips.
   - Do NOT definitively diagnose medical conditions.
   - Do NOT prescribe specific prescription drugs or alter medicine dosages.
   - Always include a gentle reminder to consult a qualified doctor or visit the nearest Primary Health Center (PHC) for serious, persistent, or worsening symptoms.
4. OUT OF SCOPE: If the user asks something completely non-health related (e.g. sports, movies, coding, politics), politely remind them that you are a SevaHealth medical assistant dedicated to health & wellness queries."""

class AIChatService:
    @staticmethod
    def generate_chat_response(messages_history):
        start_t = time.time()
        
        # 1. Cloud OpenRouter LLM fast path if preferred or set
        if PREFER_CLOUD_OCR and OPENROUTER_API_KEY:
            try:
                formatted_msgs = [{"role": "system", "content": SYSTEM_PROMPT}]
                for msg in messages_history[-6:]:
                    role = "user" if msg.get("sender") == "user" else "assistant"
                    text = msg.get("text") or msg.get("content") or ""
                    if text.strip():
                        formatted_msgs.append({"role": role, "content": text.strip()})

                payload = {
                    "model": "openai/gpt-4o-mini",
                    "messages": formatted_msgs,
                    "temperature": 0.5,
                    "max_tokens": 400
                }
                
                req = urllib.request.Request(
                    "https://openrouter.ai/api/v1/chat/completions",
                    data=json.dumps(payload).encode("utf-8"),
                    headers={
                        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                        "Content-Type": "application/json"
                    }
                )
                with urllib.request.urlopen(req, timeout=12) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode("utf-8"))
                        reply = data["choices"][0]["message"]["content"].strip()
                        elapsed = round(time.time() - start_t, 2)
                        print(f"[CHAT OPENROUTER SUCCESS] Completed in {elapsed}s")
                        return {"status": "success", "response": reply, "model": "openrouter/gpt-4o-mini", "duration": elapsed}
            except Exception as e:
                logger.warning(f"[CHAT OPENROUTER WARN] Cloud chat failed, falling back to local Ollama Mistral: {e}")

        # 2. Local Ollama Mistral LLM
        url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/chat"
        formatted_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in messages_history[-6:]:
            role = "user" if msg.get("sender") == "user" else "assistant"
            text = msg.get("text") or msg.get("content") or ""
            if text.strip():
                formatted_messages.append({"role": role, "content": text.strip()})

        payload = {
            "model": OLLAMA_CHAT_MODEL,
            "messages": formatted_messages,
            "stream": False,
            "options": {"temperature": 0.5, "top_p": 0.9, "num_ctx": 2048}
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req, timeout=45) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode('utf-8'))
                    reply = data.get("message", {}).get("content", "").strip()
                    elapsed = round(time.time() - start_t, 2)
                    print(f"[CHAT OLLAMA MISTRAL SUCCESS] Completed in {elapsed}s")
                    if reply:
                        return {"status": "success", "response": reply, "model": OLLAMA_CHAT_MODEL, "duration": elapsed}
        except Exception as e:
            logger.error(f"[AI CHAT ERROR] Local Ollama call failed: {str(e)}")

        fallback = "Aapke lakshan samanye pratit hote hain. Kripya paryapt aaram karein aur boiled pani piyein. Agar bukhar 101°F se adhik ho ya takleef bade to turant hamare doctor dwara consultation book karein."
        return {"status": "fallback", "response": fallback, "error": "LLM service unavailable", "duration": round(time.time() - start_t, 2)}
