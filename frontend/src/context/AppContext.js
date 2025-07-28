import React, { createContext, useState, useCallback, useEffect } from "react"; // Import useEffect
import PropTypes from "prop-types";
import { processYouTube, processText, processFile } from "../services/processingService";
import { extractVideoId, validateYouTubeInput } from "../utils/validator"; // Import validator and extractVideoId

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [tabValue, setTabValue] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoId, setVideoId] = useState("");
  const [error, setError] = useState(null);

  // Effect to handle YouTube URL change for immediate video display
  useEffect(() => {
    const validation = validateYouTubeInput(youtubeUrl);
    if (validation.isValid) {
      setVideoId(validation.videoId);
      setShowVideoPlayer(true);
      setError(null); // Clear error if URL becomes valid
    } else {
      setVideoId("");
      setShowVideoPlayer(false);
      // Only set error if URL is not empty and invalid
      if (youtubeUrl.trim() !== "") {
        setError(validation.message);
      } else {
        setError(null);
      }
    }
    setResults(null); // Clear results when URL changes
    setShowResults(false);
  }, [youtubeUrl]); // Dependency array: run when youtubeUrl changes

  const handleTabChange = useCallback((event, newValue) => {
    setTabValue(newValue);
    // Reset relevant states when switching tabs
    setShowVideoPlayer(false);
    setVideoId("");
    setResults(null); // Clear results on tab change
    setShowResults(false);
    setError(null); // Clear any error on tab change
    // No need to clear youtubeUrl, textInput, selectedFile here
    // as user might want to switch back and retain their input
  }, []);

  const setters = { setVideoId, setShowVideoPlayer, setShowResults, setLoading, setResults, setError };

  const handleProcessYouTube = useCallback(() => {
    // We don't need to extract videoId here again, as it's handled by useEffect
    processYouTube(youtubeUrl, setters);
  }, [youtubeUrl, setters]);

  const handleProcessText = useCallback(() => {
    processText(textInput, setters);
  }, [textInput, setters]);

  const handleProcessFile = useCallback(() => {
    processFile(selectedFile, setters);
  }, [selectedFile, setters]);

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setError(null); // Clear error on new file selection
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    tabValue,
    setTabValue,
    youtubeUrl,
    setYoutubeUrl,
    textInput,
    setTextInput,
    selectedFile,
    setSelectedFile,
    results,
    setResults,
    loading,
    setLoading,
    showResults,
    setShowResults,
    showVideoPlayer,
    setShowVideoPlayer,
    videoId,
    setVideoId,
    error,
    setError,
    handleTabChange,
    handleProcessYouTube,
    handleProcessText,
    handleProcessFile,
    handleFileSelect,
    clearError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};