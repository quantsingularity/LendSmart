import { Box, Container, Link, Typography } from "@mui/material";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: "auto",
        backgroundColor: (theme) => theme.palette.grey[200],
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          {"© "}
          {new Date().getFullYear()}{" "}
          <Link color="inherit" href="/">
            LendSmart
          </Link>
          {" - Decentralized Lending Platform"}
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
