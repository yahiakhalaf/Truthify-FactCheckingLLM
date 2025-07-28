from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import src.get_text as get_text
import src.extract_claims as extract_claims
import src.check_claims as check_claims
import os
from dotenv import load_dotenv
import time
load_dotenv()
from langchain_google_genai import ChatGoogleGenerativeAI

GEMINI_API_KEY = "AIzaSyAtjZdYeY6WREgNAM8WBIrolseiFt2jDso"   
app = FastAPI(title="TRUSTIFY Backend")

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust for your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model for YouTube endpoint
class YouTubeRequest(BaseModel):
    url: str

# Placeholder for LLM and API key (replace with your implementation)
llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.0,
        max_output_tokens=60000,
        api_key=GEMINI_API_KEY
)

SERP_API_KEY = os.getenv("SERP_API_KEY")  # Ensure this is set in your environment

# Rate limiting setup
REQUESTS_PER_MINUTE = 9
DELAY_BETWEEN_REQUESTS = 60.0 / REQUESTS_PER_MINUTE  # 6 seconds per request
semaphore = asyncio.Semaphore(REQUESTS_PER_MINUTE)

async def rate_limited_process_claim(claim, llm, language, serp_api_key):
    """Process a claim with rate limiting, tracking timestamps."""
    async with semaphore:
        # Record timestamp for this request
        request_timestamp = time.time()
        result = await check_claims.process_claim(claim, llm, language, serp_api_key)
        return result, request_timestamp

async def process_claims_with_dynamic_rate_limit(claims, llm, language, serp_api_key, initial_timestamps):
    """Process claims in parallel, starting new requests as slots become available."""
    request_timestamps = list(initial_timestamps)  # Start with extraction timestamps
    results = []
    pending_claims = claims.copy()  # Copy to avoid modifying original list
    active_tasks = []
    
    while pending_claims or active_tasks:
        current_time = time.time()
        # Get timestamps of the last 10 requests (or fewer if not enough)
        recent_timestamps = sorted(request_timestamps)[-10:] if len(request_timestamps) >= 10 else request_timestamps
        # Count requests within the last 60 seconds
        recent_count = sum(1 for ts in recent_timestamps if current_time - ts < 60.0)
        available_requests = REQUESTS_PER_MINUTE - recent_count

        if available_requests <= 0 and pending_claims:
            # Wait until the oldest timestamp is outside the 60-second window
            oldest_timestamp = recent_timestamps[0] if recent_timestamps else current_time
            wait_time = 60.0 - (current_time - oldest_timestamp)
            if wait_time > 0:
                await asyncio.sleep(wait_time)
            available_requests = 1  # At least one request is now available

        # Start new tasks if there are available requests and pending claims
        while available_requests > 0 and pending_claims:
            claim = pending_claims.pop(0)
            task = asyncio.create_task(rate_limited_process_claim(claim, llm, language, serp_api_key))
            active_tasks.append(task)
            available_requests -= 1

        if active_tasks:
            # Wait for at least one task to complete
            done, pending = await asyncio.wait(active_tasks, return_when=asyncio.FIRST_COMPLETED)
            active_tasks = list(pending)  # Convert pending set back to list
            for task in done:
                result, timestamp = task.result()
                results.append(result)
                request_timestamps.append(timestamp)
                # Keep only the most recent timestamps to avoid memory growth
                if len(request_timestamps) > REQUESTS_PER_MINUTE:
                    request_timestamps = request_timestamps[-REQUESTS_PER_MINUTE:]

    return results

@app.post("/youtube")
async def process_youtube(request: YouTubeRequest):
    """Process a YouTube URL and return fact-checking results."""
    try:
        transcript, language = get_text.extract_from_url_withtimestamps(request.url)
        claims, language, extract_timestamps = await extract_claims.extract_claims_in_parallel(transcript, llm, language)
        # Process claims with dynamic rate limiting
        results = await process_claims_with_dynamic_rate_limit(
            claims, llm, language, SERP_API_KEY, list(extract_timestamps.values())
        )
        return {"facts": results}
    except get_text.TranscriptsDisabled:
        raise HTTPException(status_code=400, detail="Transcripts are disabled for this video")
    except get_text.NoTranscriptFound:
        raise HTTPException(status_code=400, detail="No transcript available for this video")
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing YouTube URL: {str(e)}")