import React, { useContext } from "react";
  import { Box, Tabs, Tab, Button, Tooltip, Snackbar, Alert } from "@mui/material";
  import { YouTube, PictureAsPdf } from "@mui/icons-material";
  import { ThemeProvider } from "@mui/material/styles";
  import Header from "./components/Header";
  import TabContent from "./components/TabContent";
  import ResultsSection from "./components/ResultsSection";
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
      error,
      handleTabChange,
      clearError,
    } = useContext(AppContext);

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
                  sx={{
                    "& .MuiTab-root": {
                      fontSize: "1rem",
                      textTransform: "none",
                      color: "#7f8c8d",
                      minWidth: "fit-content",
                      padding: "8px 16px",
                    },
                    "& .Mui-selected": {
                      color: "#3498db !important",
                    },
                    "& .MuiTabs-indicator": {
                      backgroundColor: "#3498db",
                      height: "3px",
                    },
                  }}
                >
                  <Tab icon={<YouTube />} label="YouTube Link" iconPosition="start" disableRipple />
                </Tabs>
              </Box>
              <TabContent />
              {(tabValue !== 0 || !results?.videoId) && (
                <ResultsSection showResults={showResults} loading={loading} results={results} />
              )}
              {results && (
                <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                  <Tooltip title="Export results to PDF" arrow>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => exportResultsToPDF(results)}
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