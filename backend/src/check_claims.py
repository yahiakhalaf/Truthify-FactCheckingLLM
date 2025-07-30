import asyncio
from typing import Dict, List, Any
from langchain_core.language_models.base import BaseLanguageModel
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel
from ddgs import DDGS
from urllib.parse import urlparse, urlunparse
from serpapi import GoogleSearch, BingSearch
from datetime import timedelta

# Module-level source scoring configuration
SOURCE_SCORES = {
    'academic': {'domains': ['.edu', 'ac.uk', 'harvard.edu'], 'score': 10.0, 'tier': 'High Authority'},
    'government': {'domains': ['.gov', 'nasa.gov', 'cdc.gov'], 'score': 9.5, 'tier': 'High Authority'},
    'fact_check': {'domains': ['snopes.com', 'factcheck.org'], 'score': 9.5, 'tier': 'High Authority'},
    'medical': {'domains': ['pubmed.ncbi.nlm.nih.gov', 'nature.com'], 'score': 9.0, 'tier': 'High Authority'},
    'major_news': {'domains': ['reuters.com', 'bbc.com'], 'score': 8.0, 'tier': 'Established Media'},
    'quality_news': {'domains': ['nytimes.com'], 'score': 7.5, 'tier': 'Established Media'},
    'reference': {'domains': ['wikipedia.org'], 'score': 7.0, 'tier': 'Reference Sources'},
    'specialized': {'domains': ['ieee.org'], 'score': 6.0, 'tier': 'Specialized Sources'},
    'regional_news': {'domains': ['news', 'post'], 'score': 5.5, 'tier': 'Regional Sources'},
    'commercial': {'domains': ['.com', '.org'], 'score': 4.0, 'tier': 'General Sources'},
    'blogs': {'domains': ['medium.com'], 'score': 3.5, 'tier': 'Personal/Blog Sources'},
    'forums': {'domains': ['reddit.com'], 'score': 3.0, 'tier': 'Community Sources'}
}

# Fact-checking prompt template
FACT_CHECK_PROMPT = """
You are an expert fact checker tasked with evaluating the accuracy of a claim.
The claim is provided in the language with code '{language}'. Perform fact-checking and provide output in the same language.
Use the provided evidence snippets from reliable web sources to assess the claim's accuracy.
If the evidence is insufficient, contradictory, or from unreliable sources, classify the claim as unverifiable.

Given the factual claim below, determine if it is:
- Correct: The claim is fully supported by the evidence.
- Incorrect: The claim is contradicted by the evidence.
- Unverifiable: The evidence is insufficient, Ascension to validate or refute the claim.

Explain your reasoning in 1-2 sentences in the language with code '{language}', focusing on the evidence's relevance and reliability.

Claim:
{claim}

Evidence:
{evidence}

Return your response in this exact JSON format:
{{
  "status": "correct/incorrect/unverifiable",
  "explanation": "Your 1-2 sentence explanation"
}}
"""

# Pydantic model for structured output
class FactCheckResult(BaseModel):
    status: str
    explanation: str


def get_language_string(key: str, language: str) -> str:
    """Return language-specific string for error messages and padding."""
    strings = {
        "claim_too_short": {
            "en": "Claim too short for meaningful fact-checking",
            "ar": "الادعاء قصير جدًا للتحقق منه"
        },
        "no_search_results": {
            "en": "No search results found for verification",
            "ar": "لم يتم العثور على نتائج بحث للتحقق"
        },
        "no_reliable_sources": {
            "en": "No reliable sources found after processing",
            "ar": "لم يتم العثور على مصادر موثوقة بعد المعالجة"
        },
        "system_error": {
            "en": "System error: {error}",
            "ar": "خطأ في النظام: {error}"
        },
        "no_source": {
            "en": "No source",
            "ar": "لا يوجد مصدر"
        },
        "no_additional_source": {
            "en": "No additional source",
            "ar": "لا يوجد مصدر إضافي"
        },
        "error": {
            "en": "Error",
            "ar": "خطأ"
        }
    }
    return strings.get(key, {}).get(language, strings[key]["en"]).format(error="{error}")


def classify_and_score_source(url: str) -> tuple[str, float, str]:
    """Classify and score a source based on its URL."""
    if not url:
        return "unknown", 2.0, "Unknown"
    url_lower = url.lower()
    for category, info in SOURCE_SCORES.items():
        if any(domain in url_lower for domain in info['domains']):
            return category, info['score'], info['tier']
    return "other", 2.0, "Other Sources"


def calculate_relevance(claim: str, title: str, snippet: str) -> float:
    """Calculate relevance score for a source based on claim overlap."""
    score = 0.0
    claim_words = set(claim.lower().split())
    title_words = set(title.lower().split())
    title_overlap = len(claim_words.intersection(title_words)) / max(len(claim_words), 1)
    score += title_overlap * 2.0
    content = f"{title} {snippet}".lower()
    if any(term in content for term in ['fact', 'verify', 'check', 'evidence', 'research', 'study']):
        score += 1.0
    if len(snippet) > 200:
        score += 0.5
    return score



async def search_parallel(claim: str,queries: List[str],language: str = "en",max_results: int = 8,serpapi_key: str = "") -> List[Dict]:
    if max_results < 1:
        raise ValueError("max_results must be a positive integer")

    all_results = []
    search_queries = [claim] + [q for q in queries if q.strip()]
    seen_urls = set()

    def normalize_url(url: str) -> str:
        try:
            parsed = urlparse(url)
            normalized = parsed._replace(
                scheme=parsed.scheme.lower(),
                netloc=parsed.netloc.lower(),
                path=parsed.path.rstrip('/')
            )
            return urlunparse(normalized)
        except Exception:
            return url


    async def search_duckduckgo(query: str) -> List[Dict]:
        """Perform a DuckDuckGo search for the given query."""
        lang_code = {
            "en": "us-en",
            "ar": "ar-eg"
        }
        try:
            async with asyncio.timeout(10):
                with DDGS() as ddgs:
                    results = list(ddgs.text(query, kl=lang_code[language], region="wt-wt", safesearch="moderate", max_results=max_results))
                    return [
                        {"title": r.get("title", ""), "href": r.get("href", ""), "body": r.get("body", "")}
                        for r in results
                        if r.get("title") and r.get("href") and r.get("body")
                    ]
        except Exception as e:
            print(f"[ERROR] DuckDuckGo search failed for query '{query}': {e}")
            return []


    async def search_serpapi_engine(query: str, engine: str, search_class) -> List[Dict]:
        """Perform a search using SerpApi for a specific search engine."""
        try:
            params = {
                "q": query,
                "hl": language,
                "api_key": serpapi_key,
                "num": max_results,
                "engine": engine
            }
            async with asyncio.timeout(10):
                search = search_class(params)
                engine_results = search.get_dict().get("organic_results", [])
                return [
                    {
                        "title": r.get("title", ""),
                        "href": r.get("link", "") or r.get("url", ""),
                        "body": r.get("snippet", "")[:500] or "No summary available"
                    }
                    for r in engine_results
                    if r.get("title") and (r.get("link") or r.get("url")) and r.get("snippet")
                ]
        except Exception as e:
            print(f"[ERROR] SerpApi {engine} search failed for query '{query}': {e}")
            return []


    async def search_serpapi(query: str) -> List[Dict]:
        """Perform parallel searches using SerpApi on Google and Bing."""
        search_engines = [
          #  {"engine": "google", "class": GoogleSearch},
            {"engine": "bing", "class": BingSearch}
        ]
        tasks = [search_serpapi_engine(query, se["engine"], se["class"]) for se in search_engines]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        combined_results = []
        for result in results:
            if isinstance(result, list):
                combined_results.extend(result)
        return combined_results

    tasks = []
    for query in search_queries:
        tasks.append(search_duckduckgo(query))
        if serpapi_key:
         tasks.append(search_serpapi(query))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    for result in results:
        if isinstance(result, list):
            for item in result:
                normalized_url = normalize_url(item.get("href", ""))
                if normalized_url and normalized_url not in seen_urls:
                    seen_urls.add(normalized_url)
                    all_results.append(item)

    print(f"[DEBUG] Found {len(all_results)} unique results after deduplication")
    return all_results


def arrange_evidence(raw_results: List[Dict], claim: str, language: str) -> tuple[str, List[Dict], int]:
    """Arrange evidence by reliability and relevance, returning formatted text and top sources."""
    evidence_by_tier = {tier: [] for tier in [
        'High Authority', 'Established Media', 'Reference Sources',
        'Specialized Sources', 'Regional Sources', 'General Sources',
        'Personal/Blog Sources', 'Community Sources', 'Other Sources']}
    seen_domains = set()

    # Process all results and categorize by tier
    for result in raw_results:
        title = result.get("title", "").strip()
        link = result.get("href", "").strip()
        snippet = result.get("body", "").strip()
        if not all([title, link, snippet]) or len(snippet) < 20:
            continue
        domain = urlparse(link).netloc.lower()
        if domain in seen_domains:
            continue
        seen_domains.add(domain)
        category, base_score, tier = classify_and_score_source(link)
        relevance_score = calculate_relevance(claim, title, snippet)
        final_score = base_score + relevance_score
        evidence_entry = {
            "title": title[:120],
            "link": link,
            "snippet": snippet[:300],
            "category": category,
            "base_score": base_score,
            "relevance_score": relevance_score,
            "final_score": round(final_score, 2),
            "tier": tier
        }
        evidence_by_tier[tier].append(evidence_entry)

    evidence_text_parts = []
    top_sources = []
    tier_order = list(evidence_by_tier.keys())
    source_count = 0
    used_urls = set()  # Track which sources we've already used
    max_sources = 10

    # First pass: Add reliable sources from each tier (prioritized)
    for tier in tier_order:
        if evidence_by_tier[tier] and source_count < max_sources:
            # Sort sources in this tier by final score
            tier_sources = sorted(evidence_by_tier[tier], key=lambda x: x['final_score'], reverse=True)
            
            # Add tier header only if we're adding sources from this tier
            tier_added = False
            
            # Add up to 3 best sources from this tier, but respect overall limit
            for source in tier_sources[:3]:
                if source_count >= max_sources:
                    break
                
                # Add tier header on first source from this tier
                if not tier_added:
                    evidence_text_parts.append(f"\n=== {tier.upper()} SOURCES ===")
                    tier_added = True
                
                source_count += 1
                used_urls.add(source['link'])
                
                evidence_text_parts.append(
                    f"{source_count}. [{source['title']}]\n"
                    f"   Source: {source['link']}\n"
                    f"   Reliability: {source['base_score']}/10 | Relevance: {source['relevance_score']:.1f} | Total: {source['final_score']}\n"
                    f"   Content: {source['snippet']}\n"
                )
                
                if len(top_sources) < 3:
                    top_sources.append({
                        "title": source['title'],
                        "url": source['link']
                    })

    # Second pass: If we still have space, add remaining sources sorted by score
    if source_count < max_sources:
        remaining_sources = []
        for tier in tier_order:
            for source in evidence_by_tier[tier]:
                if source['link'] not in used_urls:  # Only unused sources
                    remaining_sources.append(source)
        
        # Sort all remaining sources by final score
        remaining_sources.sort(key=lambda x: x['final_score'], reverse=True)
        
        if remaining_sources:
            evidence_text_parts.append(f"\n=== ADDITIONAL SOURCES ===")
            for source in remaining_sources[:max_sources - source_count]:
                source_count += 1
                evidence_text_parts.append(
                    f"{source_count}. [{source['title']}]\n"
                    f"   Source: {source['link']}\n"
                    f"   Reliability: {source['base_score']}/10 | Relevance: {source['relevance_score']:.1f} | Total: {source['final_score']}\n"
                    f"   Content: {source['snippet']}\n"
                )
                
                if len(top_sources) < 3:
                    top_sources.append({
                        "title": source['title'],
                        "url": source['link']
                    })

    evidence_text = "\n".join(evidence_text_parts) if evidence_text_parts else "No reliable evidence found."
    
    # Ensure we have exactly 3 top sources
    while len(top_sources) < 3:
        top_sources.append({"title": get_language_string("no_additional_source", language), "url": ""})
    
    # Return actual count of sources used, not total available
    return evidence_text, top_sources[:3], source_count



async def verify_claim(claim: str, evidence_text: str, top_sources: List[Dict], llm: BaseLanguageModel, language: str) -> Dict:
    """Verify a claim using structured evidence and an LLM."""
    try:
        prompt = PromptTemplate(
            input_variables=["claim", "evidence","language"],
            template=FACT_CHECK_PROMPT
        )

        llm_with_structured_output = llm.with_structured_output(FactCheckResult)
        chain = prompt | llm_with_structured_output

        # Ensure top_sources has at least 3 entries
        source_inputs = top_sources[:3]
        while len(source_inputs) < 3:
            source_inputs.append({"title": get_language_string("no_additional_source", language), "url": ""})

        result = await chain.ainvoke({
            "claim": claim,
            "evidence": evidence_text,
            "language": language
        })

        result_dict = result.dict()
        # Use the input top_sources directly in the output
        result_dict.update({
            "claim": claim,
            "sources": source_inputs[:3]
        })
        return result_dict

    except Exception as e:
        print(f"[ERROR] Verification error for claim '{claim}': {e}")
        return {
            "claim": claim,
            "status": "unverifiable",
            "explanation": get_language_string("system_error", language).format(error=str(e)[:50]),
            "sources": [{"title": get_language_string("error", language), "url": ""}] * 3
        }
    


async def process_claim(claim_dict: Dict[str, Any], llm: BaseLanguageModel, language: str, SERPAPI_KEY: str) -> Dict:
    """Main function to process a single claim."""
    claim = claim_dict["claim"]
    timestamp = claim_dict["start"]
    queries = claim_dict.get("queries", [])

    if not claim or len(claim.strip()) < 7:
        return {
            "timestamp": timestamp,
            "claim": claim,
            "status": "unverifiable",
            "explanation": get_language_string("claim_too_short", language),
            "sources": [{"title": get_language_string("no_source", language), "url": ""}] * 3
        }

    try:
        # Step 1: Search for evidence
        raw_results = await search_parallel(claim, queries, language,max_results=5, serpapi_key=SERPAPI_KEY)
        if not raw_results:
            return {
                "timestamp": timestamp,
                "claim": claim,
                "status": "unverifiable",
                "explanation": get_language_string("no_search_results", language),
                "sources": [{"title": get_language_string("no_source", language), "url": ""}] * 3
            }

        # Step 2: Arrange evidence
        evidence_text, top_sources, total_sources = arrange_evidence(raw_results, claim, language)
       # print("top_sources:", top_sources)
        if total_sources == 0:
            return {
                "timestamp": timestamp,
                "claim": claim,
                "status": "unverifiable",
                "explanation": get_language_string("no_reliable_sources", language),
                "sources": [{"title": get_language_string("no_source", language), "url": ""}] * 3
            }

        # Step 3: Verify claim
        result = await verify_claim(claim, evidence_text, top_sources, llm, language)
        result["timestamp"] = timestamp
        return result

    except Exception as e:
        print(f"[ERROR] System error for claim '{claim}': {e}")
        return {
            "timestamp": timestamp,
            "claim": claim,
            "status": "unverifiable",
            "explanation": get_language_string("system_error", language).format(error=str(e)[:50]),
            "sources": [{"title": get_language_string("error", language), "url": ""}] * 3
        }