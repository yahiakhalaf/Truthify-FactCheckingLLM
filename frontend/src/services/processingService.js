import { validateYouTubeInput, validateTextInput, validateFileInput, extractVideoId } from "../utils/validator";
  import { processYouTubeUrl, processTextInput, processFileInput } from "./apiService";

  export const processYouTube = async (url, setters) => {
    const { setVideoId, setShowVideoPlayer, setShowResults, setLoading, setResults, setError } = setters;

    const validation = validateYouTubeInput(url);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const videoId = extractVideoId(url);
      const result = await processYouTubeUrl(url);
      setVideoId(videoId);
      setShowVideoPlayer(true);
      setShowResults(true);
      setResults(result); // {facts: [...]}
    } catch (error) {
      setError(error.message || "Failed to process YouTube URL");
    } finally {
      setLoading(false);
    }
  };

  export const processText = async (text, setters) => {
    const { setShowResults, setLoading, setResults, setError } = setters;

    const validation = validateTextInput(text);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await processTextInput(text);
      setShowResults(true);
      setResults(result);
    } catch (error) {
      setError(error.message || "Failed to process text");
    } finally {
      setLoading(false);
    }
  };

  export const processFile = async (file, setters) => {
    const { setShowResults, setLoading, setResults, setError } = setters;

    const validation = validateFileInput(file);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await processFileInput(file);
      setShowResults(true);
      setResults(result);
    } catch (error) {
      setError(error.message || "Failed to process file");
    } finally {
      setLoading(false);
    }
  };