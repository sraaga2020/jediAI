# youtube.py
import os
import requests
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("YOUTUBE_API_KEY")

if not API_KEY:
    raise ValueError("YOUTUBE_API_KEY not set in environment")

def search_videos(topic, max_results=3):
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": topic,
        "maxResults": max_results,
        "type": "video",
        "videoDuration": "medium",
        "order": "viewCount",
        "key": API_KEY
    }

    try:
        response = requests.get(url, params=params, timeout=5)
        if response.status_code != 200:
            print(f"YouTube API error {response.status_code}: {response.text}")
            return []  # return empty list instead of crashing

        data = response.json()
        results = []

        for item in data.get("items", []):
            snippet = item["snippet"]
            results.append({
                "title": snippet.get("title", "No title"),
                "description": snippet.get("description", ""),
                "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                "thumbnail": snippet["thumbnails"]["medium"]["url"]
            })

        return results

    except requests.RequestException as e:
        print(f"Failed to fetch videos for '{topic}': {e}")
        return []

from youtube_transcript_api import YouTubeTranscriptApi


