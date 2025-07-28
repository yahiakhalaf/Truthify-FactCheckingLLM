import asyncio
from src.extract_claims import extract_claims_in_parallel
from langchain_google_genai import ChatGoogleGenerativeAI
from src.get_text import extract_from_url_withtimestamps
import os
from dotenv import load_dotenv
load_dotenv()
async def main():
    url = "https://youtu.be/FkQWpQd9Zdo?feature=shared"
    transcript, language = extract_from_url_withtimestamps(url)
    print(type(transcript))

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.0,
        max_output_tokens=60000,
        api_key=os.getenv("GEMINI_API_KEY")
    )

    claims, language = await extract_claims_in_parallel(
        transcript_segments=transcript,
        language=language,
        llm=llm,
        overlap_size=5,
        max_concurrent=5,
        chunk_size=50,
        max_requests_per_minute=10,
        timeout_per_chunk=30
    )

    for claim in claims:
        print(f"Claim: {claim['claim']}, Start: {claim['start']})")
        print(f"queries: {claim['queries']}")
        print("\n\n")
if __name__ == "__main__":
    asyncio.run(main())
