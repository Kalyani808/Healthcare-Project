import ollama
import json
import os

sample_ocr = """
Rx
1. Tab. Augmentin 625mg
1-0-1 x 5 days
M N
after meal

2. Tab. Ultracit
1-0-1 x 2 days
M N
after meal

3. Tab. Pan-DSR
1-0-0 x 5 days
30 min before breakfast
"""

prompt = f"""You are a medical prescription parser. Extract ALL medicine entries from the following raw prescription OCR text into a JSON object.

RULES:
- Extract EVERY medicine entry found in the text.
- Do NOT invent or hallucinate missing strengths or durations if they are not in the text.
- Do NOT classify doctor names, patient names, blood pressure readings (e.g. 120/80), or clinic headers as medicines.
- Set confidence for each medicine (0.0 to 1.0).

Return ONLY valid JSON matching this schema:
{{
  "medicines": [
    {{
      "name": "Medicine Name",
      "raw_text": "Exact raw line text",
      "strength": "e.g. 625 mg or empty string",
      "frequency": "e.g. 1-0-1 or 1-0-0",
      "duration": "e.g. 5 days",
      "timing": "e.g. after meal or 30 min before breakfast",
      "confidence": 0.95
    }}
  ]
}}

Raw Prescription OCR Text:
{sample_ocr}
"""

res = ollama.chat(
    model='mistral:latest',
    messages=[{'role': 'user', 'content': prompt}],
    format='json',
    options={'temperature': 0.0}
)

print('=== MISTRAL STRUCTURED JSON OUTPUT ===')
print(res['message']['content'])
