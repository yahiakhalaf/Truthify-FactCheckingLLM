import React, { createContext, useState, useCallback } from "react";
    import PropTypes from "prop-types";
    import { processYouTube } from "../services/processingService";

    export const AppContext = createContext();

    export const AppProvider = ({ children }) => {
      const [tabValue, setTabValue] = useState(0);
      const [youtubeUrl, setYoutubeUrl] = useState("");
      const [results, setResults] = useState(null);
      const [loading, setLoading] = useState(false);
      const [showResults, setShowResults] = useState(false);
      const [showVideoPlayer, setShowVideoPlayer] = useState(false);
      const [videoId, setVideoId] = useState("");
      const [error, setError] = useState(null);

      const handleTabChange = useCallback((event, newValue) => {
        setTabValue(newValue);
        setShowVideoPlayer(false);
        setVideoId("");
        setResults(null);
        setShowResults(false);
      }, []);

      const handleProcessYouTube = useCallback(() => {
        processYouTube(youtubeUrl, { setVideoId, setShowVideoPlayer, setShowResults, setLoading, setResults, setError });
      }, [youtubeUrl]);

      const clearError = useCallback(() => setError(null), []);

      const value = {
        tabValue,
        setTabValue,
        youtubeUrl,
        setYoutubeUrl,
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
        clearError,
      };

      return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
    };

    AppProvider.propTypes = {
      children: PropTypes.node.isRequired,
    };