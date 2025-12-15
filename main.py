from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import json
import re

from ai import ask_ollama  # must return plain text from Ollama / LLM

app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Learning Path -----------------
@app.get("/generate-path/")
def generate_path(topic: str = Query(...)):
    prompt = f"""
Return ONLY valid JSON. No explanations. No markdown.

Create a learning roadmap for "{topic}".

Rules:
- 3 phases
- Each phase has exactly 3 subtopics
- Each subtopic has:
  - subtopic (string)
  - description (string)
  - resources (array of 3 URLs)

JSON FORMAT:
{{
  "Phase 1": [
    {{"subtopic": "", "description": "", "resources": ["", "", ""]}}
  ],
  "Phase 2": [
    {{"subtopic": "", "description": "", "resources": ["", "", ""]}}
  ],
  "Phase 3": [
    {{"subtopic": "", "description": "", "resources": ["", "", ""]}}
  ]
}}
"""

    raw = ask_ollama(prompt)

    if not raw or not raw.strip():
        raise HTTPException(
            status_code=502,
            detail="AI returned empty response for learning path"
        )

    # Remove ```json fences if present
    raw = re.sub(r"^```json\s*|```$", "", raw.strip(), flags=re.DOTALL)

    try:
        roadmap = json.loads(raw)
    except json.JSONDecodeError:
        print("❌ Invalid JSON from AI:\n", raw)
        raise HTTPException(
            status_code=500,
            detail="AI returned invalid JSON for learning path"
        )

    return {"learning_path": roadmap}


# ----------------- Chat -----------------
@app.get("/chat/")
def chat(topic: str = Query(...), question: str = Query(...)):
    prompt = f"""
You are an expert tutor on "{topic}".
Answer clearly in one short paragraph.
No markdown. No formatting.

Question: {question}
"""

    answer = ask_ollama(prompt)

    if not answer or not answer.strip():
        raise HTTPException(
            status_code=502,
            detail="AI returned empty chat response"
        )

    return {"answer": answer.strip()}


# ----------------- Quiz -----------------
@app.get("/generate-quiz/")
def generate_quiz(subtopic: str = Query(...), num_questions: int = 3):
    prompt = f"""
Create {num_questions} multiple-choice questions about "{subtopic}".

Return ONLY valid JSON array:
[
  {{
    "question": "",
    "options": ["", "", "", ""],
    "answer": ""
  }}
]
"""

    raw = ask_ollama(prompt)

    if not raw or not raw.strip():
        raise HTTPException(
            status_code=502,
            detail="AI returned empty quiz response"
        )

    raw = re.sub(r"^```json\s*|```$", "", raw.strip(), flags=re.DOTALL)

    try:
        quiz = json.loads(raw)
    except json.JSONDecodeError:
        print("❌ Invalid quiz JSON:\n", raw)
        raise HTTPException(
            status_code=500,
            detail="AI returned invalid JSON for quiz"
        )

    return {"quiz": quiz}
