import React from "react";
  import { Typography } from "@mui/material";
  import { HeaderPaper, LogoContainer, LogoImage, LogoText } from "../styles/theme";
  import truthifyLogo from "../assets/Icon removed bg.svg";
  import truthifyText from "../assets/Truthify removed bg.svg";

  const Header = () => {
    return (
      <HeaderPaper elevation={3}>
        <LogoContainer>
          <LogoImage src={truthifyLogo} alt="Truthify Logo" sx={{ height: "clamp(30px, 6vw, 50px)" }} />
          <LogoText src={truthifyText} alt="Truthify Text" sx={{ height: "clamp(25px, 5vw, 45px)" }} />
        </LogoContainer>
        <Typography variant="h6" sx={{ color: "#7f8c8d", fontSize: "clamp(0.9rem, 2vw, 1.1rem)" }}>
          AI-Powered Fact Checking
        </Typography>
      </HeaderPaper>
    );
  };

  export default Header;