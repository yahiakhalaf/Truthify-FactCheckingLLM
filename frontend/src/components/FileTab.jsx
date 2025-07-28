import React, { useContext } from "react";
import { Box, Typography, Alert } from "@mui/material";
import { CloudUpload, Upload } from "@mui/icons-material";
import { StyledButton, FileUploadArea } from "../styles/theme"; // Adjust path
import { AppContext } from "../context/AppContext"; // Adjust path
import { validateFileInput } from "../utils/validator"; // Adjust path

const FileTab = () => {
  const { selectedFile, handleFileSelect, handleProcessFile } = useContext(AppContext);
  const validation = validateFileInput(selectedFile); // Use your validator

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50" }}>
        Upload a file:
      </Typography>
      <FileUploadArea
        onClick={() => document.getElementById("file-input").click()}
      >
        <CloudUpload sx={{ fontSize: "3rem", color: "#bdc3c7", mb: 2 }} />
        <Typography variant="body1" sx={{ mb: 1 }}>
          Click to upload or drag and drop
        </Typography>
        <Typography variant="body2" sx={{ color: "#7f8c8d" }}>
          Supports: PDF, DOCX, TXT files
        </Typography>
      </FileUploadArea>
      <input
        type="file"
        id="file-input"
        accept=".pdf,.docx,.txt"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />
      {selectedFile && (
        <Alert
          severity={validation.isValid ? "success" : "error"} // Show error if file is invalid
          sx={{ borderRadius: "5px" }}
        >
          <strong>Selected:</strong> {selectedFile.name} (
          {formatFileSize(selectedFile.size)})
          {!validation.isValid && (
            <Typography variant="body2" color="error">
              {validation.message}
            </Typography>
          )}
        </Alert>
      )}
      <StyledButton
        variant="contained"
        startIcon={<Upload />}
        onClick={handleProcessFile}
        disabled={!validation.isValid} // Disable if file is not valid
        sx={{ alignSelf: "flex-start" }}
      >
        Upload & Analyze
      </StyledButton>
    </Box>
  );
};

export default FileTab;