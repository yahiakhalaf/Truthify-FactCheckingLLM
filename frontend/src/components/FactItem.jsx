import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, CardContent, Chip, Link } from "@mui/material";
import { CheckCircle, Cancel, Help, OpenInNew } from "@mui/icons-material";
import { FactItemCard } from "../styles/theme";

const FactItem = ({ fact, index }) => {
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "true":
      case "verified":
      case "correct":
        return <CheckCircle sx={{ color: "#27ae60" }} />;
      case "false":
      case "incorrect":
      case "misleading":
        return <Cancel sx={{ color: "#e74c3c" }} />;
      default:
        return <Help sx={{ color: "#f39c12" }} />;
    }
  };

  return (
    <FactItemCard key={index} status={fact.status?.toLowerCase()}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}> {/* Reduced mb */}
          {getStatusIcon(fact.status)}
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}> {/* Added fontWeight */}
            Claim: {fact.claim || "Claim"} {/* Format claim */}
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 2, color: "#555" }}>
          Explanation: {fact.explanation || "No explanation provided."} {/* Format explanation */}
        </Typography>

        {/* Removed Confidence Display */}
        {/*
        {fact.confidence !== undefined && (
          <Typography variant="body2" sx={{ mb: 2, color: "#666" }}>
            Confidence: {fact.confidence}%
          </Typography>
        )}
        */}

        {fact.sources && fact.sources.length > 0 && (
          <Box sx={{ mt: 2 }}> {/* Added margin-top */}
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: "#2c3e50" }}>
              Sources:
            </Typography>
            {fact.sources.map((source, sourceIndex) => (
              <Box key={sourceIndex} sx={{ mb: 0.5 }}> {/* Box for each source to ensure new line */}
                <Link
                  href={source.url || source}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  sx={{
                    display: "inline-flex", // Keep chip on one line with icon
                    alignItems: "center",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  <Chip
                    label={source.title || source}
                    size="small"
                    variant="outlined"
                    clickable
                    icon={<OpenInNew sx={{ fontSize: "0.8rem" }} />}
                    sx={{
                      color: "#3498db",
                      borderColor: "#3498db",
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "rgba(52, 152, 219, 0.1)",
                        transform: "translateY(-1px)",
                        boxShadow: "0 2px 8px rgba(52, 152, 219, 0.2)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  />
                </Link>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </FactItemCard>
  );
};

FactItem.propTypes = {
  fact: PropTypes.shape({
    status: PropTypes.string,
    claim: PropTypes.string,
    explanation: PropTypes.string,
    // confidence: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // REMOVED
    sources: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          url: PropTypes.string.isRequired,
        }),
      ])
    ),
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Added for completeness if needed elsewhere
  }),
  index: PropTypes.number.isRequired,
};

export default FactItem;