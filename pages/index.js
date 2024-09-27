import React from "react";
import { Container, Box, Typography, Button } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  return (
    <>
      <Box
        sx={{
          margin: 0,
          height: "100%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "2rem",
          marginTop: "5rem",
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "2rem",
            minHeight: "70vh",
            width: { xs: "95vw", sm: "85vw", md: "75vw" },
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              flex: 1,
              paddingRight: { md: "2rem" },
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "1.5rem",
              marginBottom: { xs: "2rem", md: 0 },
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              sx={{ color: "#1E3A8A", fontWeight: "bold" }}
            >
              Hello, Welcome to self service Kiosk
            </Typography>
            <Typography variant="body1" sx={{ color: "#374151" }}>
              Our AI-based communication platform is designed to assist those
              who are deaf and mute in connecting with the world effortlessly.
              Using advanced sign language interpretation, our platform
              translates gestures into meaningful responses.
            </Typography>
            <Typography variant="body1" sx={{ color: "#374151" }}>
              Whether you need to check your account details or start a video
              call, our digital communicator is here to make your experience
              seamless and intuitive. Choose an option below to get started!
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                sx={{
                  backgroundImage: "linear-gradient(135deg, #3B82F6, #6366F1)",
                  color: "#fff",
                  "&:hover": { backgroundColor: "#3B82F6" },
                  borderRadius: "6px",
                  padding: "0.75rem 2rem",
                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                  fontWeight: "bold",
                }}
                onClick={() => alert("View Account Details clicked")}
              >
                Check balance
              </Button>
              <Button
                variant="contained"
                sx={{
                  backgroundImage: "linear-gradient(135deg, #10B981, #14B8A6)",
                  color: "#fff",
                  "&:hover": { backgroundColor: "#10B981" },
                  borderRadius: "6px",
                  padding: "0.75rem 2rem",
                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                  fontWeight: "bold",
                }}
                onClick={() => router.push("/conversation")}
              >
                Connect with Nyla
              </Button>
            </Box>
          </Box>

          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "end",
              alignItems: "end",
              paddingLeft: "1rem",
              maxWidth: { xs: "100%", md: "50%" }, // Responsive image container width
            }}
          >
            <Image
              src="/landingPageImage.webp"
              alt="Digital Communication Concept"
              width={400}
              height={400}
              style={{ borderRadius: "6px" }}
            />
          </Box>
        </Container>
      </Box>
    </>
  );
}
