import React, { useContext } from "react";
  import { Box, Typography, TextField } from "@mui/material";
  import { PlayArrow } from "@mui/icons-material";
  import { StyledButton } from "../styles/theme";
  import { AppContext } from "../context/AppContext";
  import { validateYouTubeInput } from "../utils/validator";

  const YouTubeTab = () => {
    const { youtubeUrl, setYoutubeUrl, handleProcessYouTube } = useContext(AppContext);
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
        <StyledButton
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={handleProcessYouTube}
          disabled={!validation.isValid}
          sx={{ alignSelf: "flex-start" }}
        >
          Analyze Video
        </StyledButton>
      </Box>
    );
  };

  export default YouTubeTab;