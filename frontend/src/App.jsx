import React, { useContext } from "react";
import { Box, Tabs, Tab, Button, Tooltip, Snackbar, Alert } from "@mui/material";
import { YouTube, Keyboard, CloudUpload, PictureAsPdf } from "@mui/icons-material"; // Import new icons
import { ThemeProvider } from "@mui/material/styles";
import Header from "./components/Header";
// Removed TabContent as we'll directly render TabPanels
// import TabContent from "./components/TabContent"; // REMOVE THIS LINE
import ResultsSection from "./components/ResultsSection";
import TabPanel from "./components/TabPanel"; // Ensure this is imported
import YouTubeTab from "./components/YouTubeTab"; // Ensure this is imported
import TextTab from "./components/TextTab"; // NEW IMPORT
import FileTab from "./components/FileTab"; // NEW IMPORT
import VideoPlayer from "./components/VideoPlayer"; // Ensure this is imported

import { theme } from "./styles/theme";
import { StyledContainer, MainPaper } from "./styles/theme";
import { AppContext } from "./context/AppContext";
import { exportResultsToPDF } from "./exports/pdfExport";

function App() {
  const {
    tabValue,
    results,
    loading,
    showResults,
    showVideoPlayer, // Use showVideoPlayer from context
    videoId, // Use videoId from context
    error,
    handleTabChange,
    clearError,
  } = useContext(AppContext);

  // Function to handle PDF export (from your existing code)
  const handleExportToPDF = () => {
    if (results) {
      exportResultsToPDF(results);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <StyledContainer maxWidth="lg">
          <Header />
          <MainPaper elevation={3}>
            <Box sx={{ borderBottom: 2, borderColor: "#ecf0f1", display: "flex" }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="scrollable"
                // Styles moved to theme.js, but keeping basic structure
              >
                <Tab icon={<YouTube />} label="YouTube Link" iconPosition="start" disableRipple />
                <Tab icon={<Keyboard />} label="Text Input" iconPosition="start" disableRipple /> {/* NEW TAB */}
                <Tab icon={<CloudUpload />} label="File Upload" iconPosition="start" disableRipple /> {/* NEW TAB */}
              </Tabs>
            </Box>

            {/* Content for YouTube Tab */}
            <TabPanel value={tabValue} index={0}>
              <YouTubeTab />
              {showVideoPlayer && videoId && (
                <Box sx={{ mt: 4 }}>
                  <VideoPlayer videoId={videoId} facts={results?.facts || []} />
                </Box>
              )}
            </TabPanel>

            {/* Content for Text Tab */}
            <TabPanel value={tabValue} index={1}>
              <TextTab />
            </TabPanel>

            {/* Content for File Tab */}
            <TabPanel value={tabValue} index={2}>
              <FileTab />
            </TabPanel>

            {/* Results Section - Only show if not YouTube video player actively showing */}
            {(tabValue !== 0 || !showVideoPlayer) && ( // Re-evaluate condition: show results if not YouTube tab OR if on YouTube tab but no video player is active (e.g., initial state or invalid URL)
              <ResultsSection showResults={showResults} loading={loading} results={results} />
            )}

            {/* Export Button - Only show when results are available */}
            {results && (
              <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <Tooltip title="Export results to PDF" arrow>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleExportToPDF} // Use the new handler
                    startIcon={<PictureAsPdf />}
                    sx={{ borderRadius: 2 }}
                  >
                    Export to PDF
                  </Button>
                </Tooltip>
              </Box>
            )}
          </MainPaper>
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={clearError}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert onClose={clearError} severity="error" sx={{ width: "100%" }}>
              {error}
            </Alert>
          </Snackbar>
        </StyledContainer>
      </Box>
    </ThemeProvider>
  );
}

export default App;