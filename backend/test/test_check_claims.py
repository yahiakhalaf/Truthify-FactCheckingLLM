import asyncio
from src.extract_claims import extract_claims_in_parallel
from langchain_google_genai import ChatGoogleGenerativeAI
from src.get_text import extract_from_url_withtimestamps
from src.check_claims import process_claim  
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

    extracted_claims, language = await extract_claims_in_parallel(
        transcript_segments=transcript,
        language=language,
        llm=llm,
        overlap_size=5,
        max_concurrent=5,
        chunk_size=50,
        max_requests_per_minute=10,
        timeout_per_chunk=30
    )
    claims=extracted_claims[:3]
    for claim in claims:
        print(f"Claim: {claim['claim']}, Start: {claim['start']})")
        print(f"Queries: {claim['queries']}")
    print("\n\n")
    print("Total claims:", len(claims))
    print("*" * 65)

    for claim in claims:
        result = await process_claim(claim, llm,language=language,SERPAPI_KEY=os.getenv("SERP_API_KEY")) 
        print("Claim:", result['claim'])
        print("Start:", result['timestamp'])
        print("Status:", result['status'])
        print("Explanation:", result['explanation'])
        print("Sources:", result['sources'])
        print("*****************************************************************")
if __name__ == "__main__":
    asyncio.run(main())
