import Head from "next/head";
import "../styles/globals.css";
import { useEffect } from "react";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    fetch("/api/socket").finally(() => {
      console.log("Socket.io initialized");
    });
  }, []);
  return (
    <>
      <Head>
        <title>Deaf & Dumb Communication</title>
        <meta
          name="description"
          content="AI-based communication platform for deaf and mute users."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Component {...pageProps} />;
    </>
  );
}

export default MyApp;
