import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = "AIzaSyCojjtXTZAbs8rpPtLhiGkUEemV3-mEqFA"
url = "https://www.googleapis.com/youtube/v3/search"
params = {
    "part": "snippet",
    "q": "Python programming",  # test query
    "type": "video",
    "maxResults": 1,
    "key": API_KEY
}

response = requests.get(url, params=params)
data = response.json()
print(data)

