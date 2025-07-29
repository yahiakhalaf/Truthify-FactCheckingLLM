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

  // New: Get color based on status
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "true":
      case "verified":
      case "correct":
        return "#27ae60"; // Green
      case "false":
      case "incorrect":
      case "misleading":
        return "#e74c3c"; // Red
      default:
        return "#f39c12"; // Yellow (for unverifiable/unknown)
    }
  };

  return (
    <FactItemCard key={index} status={fact.status?.toLowerCase()}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          {getStatusIcon(fact.status)}
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Claim: {fact.claim || "Claim"}
          </Typography>
        </Box>
        {/* New: Display Status with color coding */}
        <Typography
          variant="body2" // Smaller font size for status
          sx={{
            mb: 1, // Margin bottom
            fontWeight: 600, // Make it bold like claim
            color: getStatusColor(fact.status), // Apply color based on status
          }}
        >
          Status: {fact.status ? fact.status.charAt(0).toUpperCase() + fact.status.slice(1) : "N/A"}
        </Typography>

        <Typography variant="body1" sx={{ mb: 2, color: "#555" }}>
          Explanation: {fact.explanation || "No explanation provided."}
        </Typography>

        {fact.sources && fact.sources.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: "#2c3e50" }}>
              Sources:
            </Typography>
            {fact.sources.map((source, sourceIndex) => (
              <Box key={sourceIndex} sx={{ mb: 0.5 }}>
                <Link
                  href={source.url || source}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  sx={{
                    display: "inline-flex",
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
    sources: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          url: PropTypes.string.isRequired,
        }),
      ])
    ),
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  index: PropTypes.number.isRequired,
};

export default FactItem;