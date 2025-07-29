import React, { useContext } from "react";
import { Box, Typography, TextField, CircularProgress } from "@mui/material";
import { PlayArrow, Clear } from "@mui/icons-material";
import { StyledButton } from "../styles/theme";
import { AppContext } from "../context/AppContext";
import { validateYouTubeInput } from "../utils/validator";

const YouTubeTab = () => {
  const { youtubeUrl, setYoutubeUrl, handleProcessYouTube, loading, clearYouTubeInputAndResults } = useContext(AppContext);
  const validation = validateYouTubeInput(youtubeUrl);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50" }}>
        Enter YouTube URL:
      </Typography>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="https://www.youtube.com/watch?v=..."
        value={youtubeUrl}
        onChange={(e) => setYoutubeUrl(e.target.value)}
        error={youtubeUrl && !validation.isValid}
        helperText={youtubeUrl && !validation.isValid ? validation.message : ""}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "10px",
            fontSize: "1rem",
          },
        }}
      />
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <StyledButton
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
          onClick={handleProcessYouTube}
          disabled={!validation.isValid || loading}
          sx={{ alignSelf: "flex-start" }}
        >
          {loading ? "Analyzing..." : "Analyze Video"}
        </StyledButton>
        <StyledButton
          variant="outlined"
          startIcon={<Clear />}
          onClick={clearYouTubeInputAndResults}
          disabled={!youtubeUrl && !validation.isValid && !loading}
          sx={{ alignSelf: "flex-start", borderColor: "#e74c3c", color: "#e74c3c", "&:hover": { borderColor: "#c0392b", backgroundColor: "rgba(231, 76, 60, 0.08)" } }}
        >
          Clear
        </StyledButton>
      </Box>
    </Box>
  );
};

export default YouTubeTab;