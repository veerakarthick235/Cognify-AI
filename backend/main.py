
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI(title="CognifyAI Advanced")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

INTENTS = ["Proceed", "Hesitate", "Explore", "Overload", "Abandon"]

@app.post("/analyze")
def analyze(data: dict):
    probs = [random.random() for _ in INTENTS]
    total = sum(probs)
    intent_probs = {INTENTS[i]: round(probs[i]/total, 2) for i in range(len(INTENTS))}
    top = max(intent_probs, key=intent_probs.get)

    score = int(min(100, max(0, random.randint(30, 90))))
    level = "Low" if score < 40 else "Medium" if score < 70 else "High"

    return {
        "intent": top,
        "probabilities": intent_probs,
        "cognitive_load": {"score": score, "level": level}
    }
