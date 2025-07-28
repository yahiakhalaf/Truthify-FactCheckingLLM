import React, { useContext } from "react";
import { Box, Typography, TextField } from "@mui/material";
import { Check } from "@mui/icons-material";
import { StyledButton } from "../styles/theme"; // Adjust path
import { AppContext } from "../context/AppContext"; // Adjust path
import { validateTextInput } from "../utils/validator"; // Adjust path

const TextTab = () => {
  const { textInput, setTextInput, handleProcessText } = useContext(AppContext);
  const validation = validateTextInput(textInput); // Use your validator

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50" }}>
        Enter text to fact-check:
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={6}
        variant="outlined"
        placeholder="Paste your text here..."
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        error={textInput && !validation.isValid} // Add error state based on validation
        helperText={textInput && !validation.isValid ? validation.message : ""} // Display validation message
      />
      <StyledButton
        variant="contained"
        startIcon={<Check />}
        onClick={handleProcessText}
        disabled={!validation.isValid} // Disable if text is not valid
        sx={{ alignSelf: "flex-start" }}
      >
        Check Facts
      </StyledButton>
    </Box>
  );
};

export default TextTab;