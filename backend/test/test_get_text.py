from src.get_text import extract_from_url_withtimestamps

url="https://youtu.be/FkQWpQd9Zdo?feature=shared"
transcript,language= extract_from_url_withtimestamps(url)
for segment in transcript:
    print(f"Start: {segment['start']}, Text: {segment['text']}")

