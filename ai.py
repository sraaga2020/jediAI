# ai.py
import requests

def ask_ollama(prompt: str):
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3",  # or mistral / llama2
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )
        response.raise_for_status()
        data = response.json()
        # Make sure "response" exists
        if "response" not in data:
            raise ValueError(f"No 'response' in API output: {data}")
        return data["response"]
    except requests.exceptions.RequestException as e:
        # Network or HTTP error
        raise RuntimeError(f"API request failed: {e}")
    except ValueError as e:
        # JSON parse or missing field
        raise RuntimeError(f"Invalid AI response: {e}")
