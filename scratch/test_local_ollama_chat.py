import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare_platform.settings')
django.setup()

from documents.services.chat_assistant_service import AIChatService

print("==================================================================")
print("  TESTING LOCAL OLLAMA MISTRAL CHAT ASSISTANT SERVICE ")
print("==================================================================")

# Test 1: Vague query ("which meditation should I take")
history_1 = [{"sender": "user", "text": "which meditation should I take"}]
print("\n[TEST 1] Vague Query: 'which meditation should I take'")
res_1 = AIChatService.generate_chat_response(history_1)
print(f"Status: {res_1['status']}")
print(f"Response: {res_1['response']}")

# Test 2: Hindi Health Query
history_2 = [{"sender": "user", "text": "Mujhe do din se bukhar aur sirdard hai, kya karna chahiye?"}]
print("\n[TEST 2] Hindi Query: 'Mujhe do din se bukhar aur sirdard hai, kya karna chahiye?'")
res_2 = AIChatService.generate_chat_response(history_2)
print(f"Status: {res_2['status']}")
print(f"Response: {res_2['response']}")

# Test 3: Follow-up question relying on previous message
history_3 = [
    {"sender": "user", "text": "Mujhe do din se bukhar aur sirdard hai."},
    {"sender": "ai", "text": "Aapko boiled pani pi kar aaram karna chahiye. Agar bukhar 101F se zyada ho to doctor se milein."},
    {"sender": "user", "text": "Kya main thanda pani pi sakta hoon?"}
]
print("\n[TEST 3] Follow-up Query: 'Kya main thanda pani pi sakta hoon?'")
res_3 = AIChatService.generate_chat_response(history_3)
print(f"Status: {res_3['status']}")
print(f"Response: {res_3['response']}")
