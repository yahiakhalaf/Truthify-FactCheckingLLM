import React, { useRef, memo } from "react";
import PropTypes from "prop-types";
import YouTube from "react-youtube";
import { Box, Typography, Chip } from "@mui/material";
import FactItem from "./FactItem";

const VideoPlayer = memo(({ videoId, facts = [], onReady, onStateChange }) => {
  const playerRef = useRef(null);

  // YouTube player options
  const opts = {
    height: "400",
    width: "100%",
    playerVars: {
      autoplay: 0,
      controls: 1,
      rel: 0,
      showinfo: 0,
      mute: 0,
    },
  };

  // Handle player ready
  const handleReady = (event) => {
    playerRef.current = event.target;
    if (onReady) onReady(event);
  };

  // Handle player state change
  const handleStateChange = (event) => {
    if (onStateChange) onStateChange(event);
  };

  // New: Handle timestamp click
  const handleTimestampClick = (timestamp) => {
    if (playerRef.current && playerRef.current.seekTo) {
      // Assuming timestamp is in seconds (or can be converted)
      let seconds = timestamp;
      if (typeof timestamp === 'string') {
        // Handle [HH:MM:SS] or [MM:SS] format
        const parts = timestamp.replace(/[\[\]]/g, '').split(':');
        if (parts.length === 3) { // HH:MM:SS
          seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        } else if (parts.length === 2) { // MM:SS
          seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        } else {
          // Fallback if format is unexpected, e.g., just seconds as string
          seconds = parseFloat(timestamp);
        }
      }
      playerRef.current.seekTo(seconds, true); // seekTo(seconds, allowSeekAhead)
    }
  };


  if (!videoId) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body1" color="error">
          Invalid YouTube URL. Please check the URL and try again.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", width: "100%", mt: 4 }}>
      <Box sx={{ borderRadius: "10px", overflow: "hidden" }}>
        <YouTube videoId={videoId} opts={opts} onReady={handleReady} onStateChange={handleStateChange} />
      </Box>

      {facts.length > 0 && (
        <Box sx={{ mt: 3, maxHeight: "400px", overflowY: "auto", pr: 1 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "#2c3e50" }}>
            Checked Claims {/* Renamed from "Related Claims" */}
          </Typography>
          <Box className="fact-items-container">
            {facts.map((fact, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                {fact.timestamp && (
                  <Box
                    sx={{
                      mb: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1,
                      cursor: "pointer",
                      "&:hover .timestamp-chip": {
                        backgroundColor: "rgba(52, 152, 219, 0.1)",
                        borderColor: "#3498db",
                      },
                    }}
                    onClick={() => handleTimestampClick(fact.timestamp)}
                  >
                    <Chip
                      className="timestamp-chip"
                      label={
                        typeof fact.timestamp === 'number'
                          ? `${Math.floor(fact.timestamp / 60)}:${String(Math.floor(fact.timestamp % 60)).padStart(2, "0")}`
                          : fact.timestamp
                      }
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: "bold", transition: "all 0.2s ease" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Click to jump to this moment
                    </Typography>
                  </Box>
                )}
                <FactItem fact={fact} index={index} />
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
});

VideoPlayer.propTypes = {
  videoId: PropTypes.string.isRequired,
  facts: PropTypes.arrayOf(
    PropTypes.shape({
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      claim: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      explanation: PropTypes.string.isRequired,
      sources: PropTypes.arrayOf(
        PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.shape({
            title: PropTypes.string.isRequired,
            url: PropTypes.string.isRequired,
          }),
        ])
      ),
    })
  ),
  onReady: PropTypes.func,
  onStateChange: PropTypes.func,
};

export default VideoPlayer;