import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";
import { DrawingUtils } from "@mediapipe/tasks-vision"; // Add this import for drawing
import styles from "../styles/Home.module.css"; // Assuming you have some styles
import MeadiaStream from "../compnents/meadiaStream";
import { SnackbarProvider } from 'notistack';

let gestureRecognizer;
let runningMode = "VIDEO";
let webcamRunning = false;

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [dmessage, setMessage] = useState("");
  let prev = "";

  useEffect(() => {
    const loadGestureRecognizer = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      );
      gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: "GPU",
        },
        runningMode: runningMode,
        numHands: 2,
      });
      setLoading(false);
    };

    loadGestureRecognizer();

    return () => {
      if (webcamRunning) {
        // Stop the webcam stream if it's running
        const stream = videoRef.current.srcObject;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop());
        }
      }
    };
  }, []);

  const enableCam = async () => {
    if (!gestureRecognizer) {
      console.log("test", gestureRecognizer);
      alert("Please wait for gestureRecognizer to load");
      return;
    }

    webcamRunning = !webcamRunning;
    const constraints = { video: true };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      // videoRef.current.play();
      predictWebcam();
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  };

  let lastVideoTime = -1;
  async function predictWebcam() {
    const canvasCtx = canvasRef.current.getContext("2d");
    const webcamElement = videoRef.current.video;

    if (runningMode === "IMAGE") {
      runningMode = "VIDEO";
      await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
    }

    let nowInMs = Date.now();
    if (webcamElement.currentTime !== lastVideoTime) {
      lastVideoTime = webcamElement.currentTime;
      const results = await gestureRecognizer.recognizeForVideo(
        webcamElement,
        nowInMs,
      );

      const videoWidth = videoRef.current.video.videoWidth;
      const videoHeight = videoRef.current.video.videoHeight;

      // Set video width
      videoRef.current.video.width = videoWidth;
      videoRef.current.video.height = videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, videoWidth, videoHeight);
      const drawingUtils = new DrawingUtils(canvasCtx);

      if (results.landmarks) {
        if (results?.gestures[0]?.categoryName) {
          console.log(
            results.gestures[0].categoryName,
            results.gestures[0].displayName,
            "=====",
          );
        }
        for (const landmarks of results.landmarks) {
          drawingUtils.drawConnectors(
            landmarks,
            GestureRecognizer.HAND_CONNECTIONS,
            { color: "#00FF00", lineWidth: 5 },
          );
          drawingUtils.drawLandmarks(landmarks, {
            color: "#FF0000",
            lineWidth: 2,
          });
        }
      }
      canvasCtx.restore();

      // Display gesture results (e.g., category and score)
      if (results.gestures.length > 0) {
        const categoryName = results.gestures[0][0].categoryName;
        const categoryScore = parseFloat(
          results.gestures[0][0].score * 100,
        ).toFixed(2);
        if (categoryName !== "None" && categoryScore > 30) {
          let message = "";
          switch (categoryName) {
            case "Victory":
              message = "I'm Fine";
              break;
            case "Thumb_Down":
              message = "No, Please";
              break;
            case "Thumb_Up":
              message = "Ok, Fine";
              break;
            case "Closed_Fist":
              message = "I'm Good";
              break;
            case "Open_Palm":
              message = "Hello, How are you?";
              break;
            case "Pointing_Up":
              message = "Thank you";
              break;
            case "ILoveYou":
              message = "Can you check my Bank Balance please?";
              break;
          }
          if (prev !== message) {
            prev = message;
            console.log(message, "-----");
            setMessage(message);
          }

          // console.log(
          //   `Gesture: ${categoryName}, Confidence: ${categoryScore}%`,
          // );
        }
      }
    }

    if (webcamRunning) {
      requestAnimationFrame(predictWebcam);
    }
  }

  return (
    <SnackbarProvider maxSnack={3}>
      <Head>
        <title>Gesture Recognition</title>
      </Head>
      <h3>Gesture Recognition</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <div>
            <Webcam
              ref={videoRef}
              style={{ width: "480px", height: "360px" }}
              videoConstraints={{ facingMode: "user" }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "480px",
                height: "360px",
              }}
            />
            <h2 style={{ color: "lightsalmon" }}>{dmessage}</h2>
          </div>
          <MeadiaStream signText={dmessage} enableSignLanguage={enableCam} />
        </div>
      )}
    </SnackbarProvider>
  );
}
