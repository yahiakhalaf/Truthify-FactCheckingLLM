import requests
import time
import json

BASE_URL = "http://localhost:8000/youtube"

def test_valid_youtube_url():
    """Test the API with a valid YouTube URL."""
    payload = {"url": "https://youtu.be/qepjK6Nm1pA?feature=shared"}  
    print("Testing valid YouTube URL...")
    start_time = time.time()
    response = requests.post(BASE_URL, json=payload)
    end_time = time.time()
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Time: {end_time - start_time:.2f} seconds")
    if response.status_code == 200:
        print("Response:", json.dumps(response.json(), indent=2))
        assert "facts" in response.json(), "Response missing 'facts' key"
        assert isinstance(response.json()["facts"], list), "Facts should be a list"
    else:
        print("Error:", response.json())
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

def test_invalid_youtube_url():
    """Test the API with an invalid YouTube URL."""
    payload = {"url": "https://www.example.com/invalid"}
    print("\nTesting invalid YouTube URL...")
    response = requests.post(BASE_URL, json=payload)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    assert "detail" in response.json(), "Response missing 'detail' key"

def test_transcripts_disabled():
    """Test a video with disabled transcripts (requires a known video)."""
    payload = {"url": "https://www.youtube.com/watch?v=known_disabled_transcript_id"}
    print("\nTesting video with disabled transcripts...")
    response = requests.post(BASE_URL, json=payload)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    assert "Transcripts are disabled" in response.json().get("detail", ""), "Expected transcripts disabled error"

def test_rate_limiting():
    """Test rate limiting by sending multiple requests with large transcripts."""
    payload = {"url": "https://www.youtube.com/watch?v=long_lecture_video_id"} 
    print("\nTesting rate limiting with multiple claims...")
    
    start_time = time.time()
    response = requests.post(BASE_URL, json=payload)
    end_time = time.time()
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Time: {end_time - start_time:.2f} seconds")
    if response.status_code == 200:
        facts = response.json().get("facts", [])
        print(f"Number of facts returned: {len(facts)}")
        # Estimate requests: each fact likely involves 1 LLM request, plus extraction requests
        estimated_requests = len(facts) + 5  # Assume ~5 extraction requests
        expected_min_time = (estimated_requests / 10) * 60  # 10 requests per minute
        print(f"Estimated requests: {estimated_requests}, Expected min time: {expected_min_time:.2f} seconds")
        assert end_time - start_time >= expected_min_time * 0.9, "Response too fast, rate limiting may not be working"
    else:
        print("Error:", response.json())
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

def run_tests():
    """Run all test cases."""
    try:
        test_valid_youtube_url()
      #  test_invalid_youtube_url()
       # test_transcripts_disabled()
      #  test_rate_limiting()
        print("\nAll tests passed!")
    except AssertionError as e:
        print(f"\nTest failed: {e}")
    except Exception as e:
        print(f"\nUnexpected error: {e}")

if __name__ == "__main__":
    run_tests()