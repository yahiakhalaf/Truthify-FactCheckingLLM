import { validateYouTubeInput, validateTextInput, validateFileInput, extractVideoId } from "../utils/validator";
import { processYouTubeUrl, processTextInput, processFileInput } from "./apiService"; // Your actual API service

export const processYouTube = async (url, setters) => {
  const { setVideoId, setShowVideoPlayer, setShowResults, setLoading, setResults, setError } = setters;

  const validation = validateYouTubeInput(url);
  if (!validation.isValid) {
    setError(validation.message); // Use setError from context
    return;
  }

  setLoading(true);
  setError(null); // Clear previous errors

  try {
    const videoId = extractVideoId(url);
    const result = await processYouTubeUrl(url); // Use your API service
    setVideoId(videoId);
    setShowVideoPlayer(true);
    setShowResults(true);
    setResults(result);
  } catch (error) {
    setError(error.message || "Failed to process YouTube URL. Please try again."); // More descriptive error
  } finally {
    setLoading(false);
  }
};

export const processText = async (text, setters) => {
  const { setShowResults, setLoading, setResults, setError } = setters; // Include setError

  const validation = validateTextInput(text);
  if (!validation.isValid) {
    setError(validation.message); // Use setError from context
    return;
  }

  setLoading(true);
  setError(null); // Clear previous errors

  try {
    const result = await processTextInput(text); // Use your API service
    setShowResults(true);
    setResults(result);
  } catch (error) {
    setError(error.message || "Failed to process text. Please try again."); // More descriptive error
  } finally {
    setLoading(false);
  }
};

export const processFile = async (file, setters) => {
  const { setShowResults, setLoading, setResults, setError } = setters; // Include setError

  const validation = validateFileInput(file);
  if (!validation.isValid) {
    setError(validation.message); // Use setError from context
    return;
  }

  setLoading(true);
  setError(null); // Clear previous errors

  try {
    const result = await processFileInput(file); // Use your API service
    setShowResults(true);
    setResults(result);
  } catch (error) {
    setError(error.message || "Failed to process file. Please try again."); // More descriptive error
  } finally {
    setLoading(false);
  }
};