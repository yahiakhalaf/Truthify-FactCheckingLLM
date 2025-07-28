from typing import List, Tuple, Dict, Any
from langchain_core.language_models.base import BaseLanguageModel
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel 
from langchain_core.exceptions import OutputParserException
import asyncio
import time
from decimal import Decimal, ROUND_DOWN


class ClaimItem(BaseModel):
    start: float
    "Start time of the claim in seconds (from the first relevant segment)"
    claim: str
    "The full factual claim text reconstructed from one or more segments"
    queries: List[str]
    "Two rephrased queries for searching this claim"


class ClaimDict(BaseModel):
    language: str
    claims: List[ClaimItem]


class RateLimiter:
    """Custom async rate limiter using a token bucket algorithm."""
    def __init__(self, requests_per_minute: int):
        if requests_per_minute <= 0:
            raise ValueError("requests_per_minute must be positive")
        self.rate = Decimal(str(requests_per_minute)) / Decimal('60.0')  # Requests per second
        self.capacity = requests_per_minute
        self.tokens = Decimal(str(self.capacity))
        self.last_refill = time.monotonic()
        self.lock = asyncio.Lock()


    async def acquire(self):
        async with self.lock:
            now = time.monotonic()
            elapsed = Decimal(str(now - self.last_refill))
            new_tokens = elapsed * self.rate
            self.tokens = min(Decimal(str(self.capacity)), self.tokens + new_tokens).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
            self.last_refill = now

            if self.tokens < 1:
                sleep_time = float((Decimal('1') - self.tokens) / self.rate)
                await asyncio.sleep(sleep_time)
                self.tokens = min(Decimal(str(self.capacity)), self.tokens + self.rate * Decimal(str(sleep_time))).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
            self.tokens -= 1


# Language mapping for more explicit instructions
LANGUAGE_NAMES = {
    'en': 'English',
    'ar': 'Arabic',
}

def get_language_name(language_code: str) -> str:
    """Get the full language name from language code."""
    return LANGUAGE_NAMES.get(language_code.lower(), f"language with code '{language_code}'")


async def extract_claims_in_parallel(
    transcript_segments: List[Dict[str, Any]], 
    llm: BaseLanguageModel,
    language: str, 
    chunk_size: int = 80, 
    overlap_size: int = 5,
    max_concurrent: int = 5,
    max_requests_per_minute: int = 10,
    timeout_per_chunk: float = 30.0
) -> Tuple[List[Dict[str, Any]], str, Dict[int, float]]:
    """
    Extracts factual claims from timestamped transcript segments using an LLM, processing overlapping chunks in parallel with rate limiting.
    Ensures extracted claims maintain the original language of the transcript and generates search queries for each claim.
    Tracks the request number and timestamp of each LLM request.

    Args:
        transcript_segments: List of dicts with 'start' and 'text' keys.
        llm: A LangChain-compatible language model supporting structured JSON output.
        language: The language code of the transcript (e.g., 'en', 'ar').
        chunk_size: Number of segments per chunk for parallel processing.
        overlap_size: Number of segments to overlap between consecutive chunks.
        max_concurrent: Maximum number of concurrent API calls.
        max_requests_per_minute: Maximum number of API requests per minute.
        timeout_per_chunk: Timeout in seconds for each chunk's LLM call.

    Returns:
        Tuple containing:
        - List of claims (with start times and search queries)
        - The input language
        - Dictionary mapping request number to timestamp (in seconds since epoch)
    """
    # Input validation
    if not transcript_segments:
        raise ValueError("transcript_segments cannot be empty")
    if not all('start' in seg and 'text' in seg for seg in transcript_segments):
        raise ValueError("All segments must have 'start' and 'text' keys")
    if overlap_size >= chunk_size:
        raise ValueError("overlap_size must be less than chunk_size")
    if max_concurrent <= 0 or max_requests_per_minute <= 0:
        raise ValueError("max_concurrent and max_requests_per_minute must be positive")
    if not language:
        raise ValueError("language cannot be empty")

    # Split segments into overlapping chunks
    chunks = []
    step = max(1, chunk_size - overlap_size)
    for i in range(0, len(transcript_segments), step):
        end_index = min(i + chunk_size, len(transcript_segments))
        chunks.append(transcript_segments[i:end_index])
        if end_index == len(transcript_segments):
            break

    # Get language name for more explicit instructions
    language_name = get_language_name(language)

    # Enhanced prompt template with explicit language preservation instructions and search query generation
    prompt_template = """
You are an assistant to a fact-checker tasked with extracting **factual claims** from timestamped transcript segments and generating search queries for each claim. Your goal is to produce a list of specific, verifiable, and fully decontextualized claims that can be independently verified using reliable sources, along with search queries to help verify each claim.

**CRITICAL LANGUAGE REQUIREMENT**: The transcript is in {language_name} (language code: '{language}'). You MUST extract and return all claims in the EXACT SAME LANGUAGE as the original transcript. Do NOT translate, paraphrase in another language, or mix languages. Preserve the original language, terminology, names, and expressions exactly as they appear in the transcript.

**SEARCH QUERY GENERATION**: For each extracted claim, you must generate exactly 2 different search queries in {language_name} that would help verify the claim. These queries should:
1. Be concise and focused (3-8 words each)
2. Use different phrasings and keywords to maximize search coverage
3. Focus on the key factual elements that can be verified
4. Be suitable for web search engines
5. Target reliable sources like news articles, academic papers, official records, etc.

Each transcript segment is provided with a timestamp in the format [MM:SS] and a text snippet. Note:
- Segments may not be complete sentences or claims.
- Factual claims may span multiple consecutive segments.
- A factual claim is a statement that can be objectively verified as true or false based on empirical evidence (e.g., historical facts, dates, names, statistics).
- Claims must be **entailed** by the transcript (if the transcript is true, the claim must be true).
- Claims must be **fully decontextualized** (understandable in isolation without needing additional context).
- Claims must capture all **verifiable content** while excluding unverifiable content (e.g., opinions, speculations, recommendations).
- Identify and resolve **referential ambiguity** (e.g., unclear pronouns, acronyms) and **structural ambiguity** (e.g., multiple interpretations) using the provided context (all segments in the input).
- If a segment or claim contains unresolvable ambiguity, exclude it from the output.
- Claims must be complete, declarative sentences in the original language.
- **Decompose** each clarified segment into discrete, specific, and verifiable propositions, retaining critical context (e.g., if the segment states "John said X," the claim must include "John said").

### Language-Specific Instructions for Claims:
- Maintain original grammar, syntax, and sentence structure of {language_name}
- Preserve proper nouns, technical terms, and specialized vocabulary in their original form
- Keep cultural references, idioms, and expressions in the original language
- Maintain the original writing direction and script (if applicable)
- Do not anglicize names, places, or terms that appear in the original language

### Search Query Guidelines:
- All search queries must be in {language_name} for maximum search engine compatibility
- Each query should approach the verification from a different angle
- Include specific names, dates, locations, or numbers when relevant
- Use synonyms and alternative phrasings across the two queries
- Make queries specific enough to find relevant sources but broad enough to capture various perspectives

### Instructions
1. **Selection**: For each segment or group of consecutive segments, determine if it contains at least one specific and verifiable proposition. Exclude:
   - Non-declarative statements (e.g., questions, recommendations).
   - Preambles or introductory phrases (e.g., "Here are some examples:").
   - Statements missing key information (e.g., incomplete or vague).
   - Statements about a lack of information (e.g., "The dataset does not contain X").
2. **Disambiguation**:
   - Check for **referential ambiguity** (e.g., unclear pronouns like "he," undefined acronyms). Resolve using the context (all segments). If unresolvable, exclude the segment.
   - Check for **structural ambiguity** (e.g., a sentence with multiple interpretations). List possible interpretations and determine if the context clearly supports one. If not, exclude the segment.
   - Output a clarified version of the segment if all ambiguities are resolved, maintaining the original language.
3. **Decomposition**:
   - Break down each clarified segment into discrete, verifiable, and decontextualized propositions.
   - Ensure each proposition is specific, verifiable, and retains necessary context (e.g., who said or did something).
   - Each proposition must be a complete, declarative sentence in {language_name}.
4. **Search Query Generation**:
   - For each extracted claim, create exactly 2 search queries in {language_name}
   - Focus on the most verifiable aspects of the claim
   - Use different keywords and phrasings for each query
   - Keep queries concise but specific
5. **Output**:
   - Assign each claim the **start time** of the first segment contributing to it.
   - Return only claims that are specific, verifiable, and fully decontextualized.
   - All claims and queries must be in {language_name} exactly as they would naturally appear in that language.
   - All search queries must be in {language_name}.
   - If no verifiable claims are found, return an empty list.

### Examples of Good Search Queries:
For a claim about "Albert Einstein was born in 1879":
- "Albert Einstein birth year 1879"
- "Einstein born when date"

### Transcript
{transcript}

Return your output strictly as JSON with this format:
{{
  "language": "{language}",
  "claims": [
    {{
      "start": <start_time_in_seconds>,
      "claim": "<full factual claim in {language_name}>",
      "queries": [
        "<search query 1 in {language_name}>",
        "<search query 2 in {language_name}>"
      ]
    }},
    ...
  ]
}}

Remember: ALL claims and queries must be in {language_name}. Do not translate the claims or change their language under any circumstances.
"""

    prompt = PromptTemplate(
        input_variables=["transcript", "language", "language_name"],
        template=prompt_template,
    )

    structured_llm = llm.with_structured_output(ClaimDict)
    chain = prompt | structured_llm

    # Initialize rate limiter and semaphore
    rate_limiter = RateLimiter(max_requests_per_minute)
    semaphore = asyncio.Semaphore(max_concurrent)
    request_counter = 0
    request_timestamps = {}

    async def process_chunk(chunk: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[int, float]]:
        nonlocal request_counter, request_timestamps
        async with semaphore:
            await rate_limiter.acquire()
            try:
                # Record request timestamp
                request_counter += 1
                request_timestamps[request_counter] = time.time()
                formatted_transcript = "\n".join(
                    f"[{int(seg['start'] // 60):02d}:{int(seg['start'] % 60):02d}] {seg['text']}" 
                    for seg in chunk
                )
                async with asyncio.timeout(timeout_per_chunk):
                    result = await chain.ainvoke({
                        "transcript": formatted_transcript,
                        "language": language,
                        "language_name": language_name
                    })
                    
                    # Additional validation to ensure claims are in the original language and queries are properly formatted
                    validated_claims = []
                    for item in result.claims:
                        claim_text = item.claim.strip()
                        if claim_text and len(item.queries) == 2:  # Ensure we have exactly 2 queries
                            # Validate that all queries are non-empty strings
                            valid_queries = [q.strip() for q in item.queries if q.strip()]
                            if len(valid_queries) == 2:  # Only add if we have exactly 2 valid queries
                                validated_claims.append({
                                    "start": item.start, 
                                    "claim": claim_text,
                                    "queries": valid_queries
                                })
                    
                    return validated_claims, {request_counter: request_timestamps[request_counter]}
                    
            except (asyncio.TimeoutError, OutputParserException, Exception) as e:
                print(f"Error processing chunk: {e}")
                return [], {request_counter: request_timestamps[request_counter]}

    # Process chunks in parallel
    tasks = [process_chunk(chunk) for chunk in chunks]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Merge results
    all_claims = []
    all_timestamps = {}
    for result in results:
        if isinstance(result, Exception):
            print(f"Exception in chunk processing: {result}")
            continue
        claims, timestamps = result
        all_claims.extend(claims)
        all_timestamps.update(timestamps)

    # Remove duplicates while preserving order and original language
    seen = set()
    unique_claims = []
    for claim in all_claims:
        claim_text = claim["claim"]
        # Create a normalized version for duplicate detection (but keep original for output)
        normalized_claim = claim_text.lower().strip()
        if normalized_claim not in seen and claim_text.strip():
            seen.add(normalized_claim)
            unique_claims.append(claim)

    # Final validation: ensure all claims are properly formatted and in original language with valid queries
    final_claims = []
    for claim in unique_claims:
        if (claim["claim"] and 
            len(claim["claim"].strip()) > 10 and  # Minimum length check
            "queries" in claim and 
            len(claim["queries"]) == 2 and
            all(isinstance(q, str) and len(q.strip()) > 0 for q in claim["queries"])):
            final_claims.append({
                "start": claim["start"],
                "claim": claim["claim"].strip(),
                "queries": [q.strip() for q in claim["queries"]]
            })

    print(f"Extracted {len(final_claims)} unique claims with search queries in {language_name}")
    
    return final_claims, language, all_timestamps