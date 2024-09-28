import React from "react";
import { Container, Box, Typography, Button } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  return (
    <>
    <div>
      <div style={{ zIndex: 9 }} className="w-full bg-gradient-to-br from-[#000] to-[#6366F1] text-white py-4 px-6 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-semibold">Hawking Hands</h1>
      </div>
      </div>
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
              Welcome to Hawking Hands
            </Typography>
            <h3 style={{fontSize: '14px', marginTop: '-20px',  fontWeight: 600}}>Tech for Empowering Abilities</h3>
            <Typography variant="body1" sx={{ color: "#374151" }}>
            Our AI-powered communication platform is designed to help deaf and mute individuals connect with the world effortlessly. 
            By using advanced sign language interpretation, our platform translates gestures into meaningful text or speech.
            </Typography>
            <Typography variant="body1" sx={{ color: "#374151" }}>
            Whether you're looking to find a suitable program or need assistance with an application, 
            our digital communicator is here to guide you every step of the way.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
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
