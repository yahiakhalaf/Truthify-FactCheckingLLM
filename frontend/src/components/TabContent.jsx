import React, { useContext } from "react";
import TabPanel from "./TabPanel";
import YouTubeTab from "./YouTubeTab";
import VideoPlayer from "./VideoPlayer";
import { AppContext } from "../context/AppContext";
import { Box } from "@mui/material";

const TabContent = () => {
  const { tabValue, results, showVideoPlayer, videoId } = useContext(AppContext);

  return (
    <>
      <TabPanel value={tabValue} index={0}>
        <YouTubeTab />
        {showVideoPlayer && videoId && (
          <Box sx={{ mt: 4 }}>
            <VideoPlayer videoId={videoId} facts={results?.facts || []} />
          </Box>
        )}
      </TabPanel>
    </>
  );
};

export default TabContent;