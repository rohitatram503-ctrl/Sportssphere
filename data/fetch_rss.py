import feedparser
import json
import csv
import pandas as pd
from pymongo import MongoClient
from bs4 import BeautifulSoup
import os
import datetime

FEEDS = {
    "Gov Schemes": "https://news.google.com/rss/search?q=khelo+india+athlete+scholarship+scheme&hl=en-IN&gl=IN&ceid=IN:en",
    "Selection Trials": "https://news.google.com/rss/search?q=sports+selection+trials+india&hl=en-IN&gl=IN&ceid=IN:en",
    "Sports Quota Jobs": "https://news.google.com/rss/search?q=sports+quota+job+india&hl=en-IN&gl=IN&ceid=IN:en",
    "Talent Identification": "https://news.google.com/rss/search?q=talent+scout+sports+india&hl=en-IN&gl=IN&ceid=IN:en",
    "Private Scholarships": "https://news.google.com/rss/search?q=sports+foundation+scholarship+india+athlete&hl=en-IN&gl=IN&ceid=IN:en"
}

CATEGORY_MAP = {
    "Gov Schemes": "Scholarship",
    "Selection Trials": "Event",
    "Sports Quota Jobs": "Job",
    "Talent Identification": "Training",
    "Private Scholarships": "Scholarship"
}

MONGO_URI = "mongodb://localhost:27017/sportssphere"
DB_NAME = "sportssphere"

def parse_description(html_content):
    if not html_content:
        return None, None
    soup = BeautifulSoup(html_content, "html.parser")
    img = soup.find("img")
    image_url = img["src"] if img and "src" in img.attrs else None
    text = soup.get_text(separator=" | ", strip=True)
    return image_url, text

def fetch_and_parse():
    all_articles = []
    
    for category, url in FEEDS.items():
        print(f"Fetching {category}...")
        feed = feedparser.parse(url)
        
        for entry in feed.entries:
            title = entry.title
            link = entry.link
            pubDate = entry.get("published", "")
            
            # parse date for sorting
            import email.utils
            parsed_date = email.utils.parsedate_to_datetime(pubDate) if pubDate else datetime.datetime.now(datetime.timezone.utc)
            
            source_name = ""
            if "source" in entry and "title" in entry.source:
                source_name = entry.source.title
            
            description = entry.get("description", "")
            image_url, main_text = parse_description(description)
            
            # Formatting as an Opportunity
            article = {
                "title": title,
                "type": CATEGORY_MAP[category],
                "sport": "Various", 
                "minScore": 0,
                "targetAgeMin": 0,
                "targetAgeMax": 100,
                "description": f"{main_text} (Source: {source_name})",
                "link": link,
                "source": "Auto-Fetched",
                "status": "Pending",
                "createdAt": parsed_date,
                "updatedAt": parsed_date,
            }
            if image_url:
                article["image_url"] = image_url
            all_articles.append(article)
            
    # Sort by date descending (latest first)
    all_articles.sort(key=lambda x: x["createdAt"], reverse=True)
    return all_articles

def save_to_json(data, folder):
    filepath = os.path.join(folder, "opportunities.json")
    # Convert datetime to string for JSON
    json_data = [{**item, "createdAt": item["createdAt"].isoformat(), "updatedAt": item["updatedAt"].isoformat()} for item in data]
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(json_data, f, ensure_ascii=False, indent=4)
    print(f"Saved to {filepath}")

def save_to_csv(data, folder):
    if not data:
        return
    filepath = os.path.join(folder, "opportunities.csv")
    csv_data = [{**item, "createdAt": item["createdAt"].isoformat(), "updatedAt": item["updatedAt"].isoformat()} for item in data]
    df = pd.DataFrame(csv_data)
    df.to_csv(filepath, index=False, encoding="utf-8")
    print(f"Saved to {filepath}")

def save_to_mongo(data):
    if not data:
        return
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db["opportunities"]
    
    for article in data:
        # We don't want to overwrite if the status was changed by admin, so use $setOnInsert for some fields
        update_data = {
            "$set": {
                "title": article["title"],
                "type": article["type"],
                "description": article["description"],
                "updatedAt": article["updatedAt"]
            },
            "$setOnInsert": {
                "sport": article["sport"],
                "minScore": article["minScore"],
                "targetAgeMin": article["targetAgeMin"],
                "targetAgeMax": article["targetAgeMax"],
                "source": article["source"],
                "status": article["status"],
                "createdAt": article["createdAt"]
            }
        }
        
        collection.update_one(
            {"link": article["link"]}, # Use link as primary key
            update_data,
            upsert=True
        )
    print("Saved to MongoDB in main 'opportunities' collection, sorted by latest date.")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    articles = fetch_and_parse()
    print(f"Fetched {len(articles)} total articles.")
    save_to_json(articles, base_dir)
    save_to_csv(articles, base_dir)
    save_to_mongo(articles)
    print("Done!")
