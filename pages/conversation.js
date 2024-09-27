import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useCallObject } from '@daily-co/daily-react';
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";
import { DrawingUtils } from "@mediapipe/tasks-vision";
import MeadiaStream from "../compnents/meadiaStream";
import { useSnackbar } from 'notistack';
import Zoom from '@mui/material/Zoom';
import Grow from '@mui/material/Grow';
import { Button } from "@mui/material";

let gestureRecognizer;
let runningMode = "VIDEO";
let webcamRunning = false;

const Conversation = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [dmessage, setMessage] = useState("");
  const [started, setStarted] = useState(false);
  const [checked, setChecked] = useState(true);
  const [session, setSession] = useState({
    id: "",
    name: ""
  });
  const { enqueueSnackbar } = useSnackbar();
  let prev = "";
  let callObject = useCallObject({
    options: {
      // audioSource: mediaStreamTrack,
      startAudioOff: false,
      // url: conversation?.conversation_url || "",
      userName: "Ajay",
    },
  });

  async function HandlJoin({ conversation_url }) {
    setLoading(true)
    console.log("===---", conversation_url)
    try {
      // await callObject?.leave()
      const res = await callObject?.join({ url: conversation_url })
      console.log(res, 'res')
      setLoading(false)
      // enableSignLanguage()
      setTimeout(() => {
        Object.values(callObject.participants()).forEach(user => {
          console.log(callObject.participants(), "part", user)
          if (user.owner) {
            setSession({
              id: user.session_id,
              name: user.user_name
            })
            setLoading(false)
          }
        })
      }, 3000);
      enqueueSnackbar('Successfully joined', { variant: 'success' })
    } catch (error) {
      console.log(error)
      enqueueSnackbar(error.message, { variant: 'error' })
      setLoading(false)
    }
  }

  useEffect(() => {
    setTimeout(() => setChecked(true), 500)
    const loadGestureRecognizer = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
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
        const stream = videoRef?.current?.srcObject;
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
    setStarted(true)
    makeConversation();

    webcamRunning = !webcamRunning;
    const constraints = { video: true };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      // videoRef.current.play();
      setTimeout(() => predictWebcam(),5000)
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  };

  let lastVideoTime = -1;

  async function predictWebcam() {
    try {
    const canvasCtx = canvasRef.current.getContext("2d");
    const webcamElement = videoRef.current.video;

    if (runningMode === "IMAGE") {
      runningMode = "VIDEO";
      await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
    }

    let nowInMs = Date.now();
    if (webcamElement.currentTime !== lastVideoTime) {
      lastVideoTime = webcamElement.currentTime;
      const results = await gestureRecognizer?.recognizeForVideo(
        webcamElement,
        nowInMs
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
            "====="
          );
        }
        for (const landmarks of results.landmarks) {
          drawingUtils.drawConnectors(
            landmarks,
            GestureRecognizer.HAND_CONNECTIONS,
            { color: "#00FF00", lineWidth: 5 }
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
          results.gestures[0][0].score * 100
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
          //   `Gesture: ${categoryName}, Confidence: ${categoryScore}%`
          // );
        }
      }
    }

    if (webcamRunning) {
      requestAnimationFrame(predictWebcam);
    }
  } catch (error) {
      console.log(error)
  }
  }

  const makeConversation = async () => {
    setLoading(true);
    const url = 'https://tavusapi.com/v2/conversations';
    const apiKey = 'f181ad861a6c415fac24418c195f27a7';

    const data = {
      replica_id: 'rfb51183fe',
      persona_id: 'p88964a7',
      callback_url: 'https://eoh7blrwpnctppa.m.pipedream.net',
      conversation_name: 'Tets Ajay Test',
    };
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      const responseData = await response.json();
      console.log(responseData);
      setTimeout(() => {
        HandlJoin(responseData)
      }, 2000)
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="w-full bg-gradient-to-br from-[#000] to-[#6366F1] text-white py-4 px-6 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-semibold">Hawking Hands</h1>
      </div>
      {
        !started ?
          <Zoom in style={{ transitionDelay: '100ms' }}>
            <video autoPlay muted loop height="100%">
              <source src="/videos/sign-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </Zoom> :
          <div className="flex-grow w-full flex justify-center items-center p-6 lg:p-5 bg-gray-100">
            <div className="relative w-full max-w-screen-lg flex h-full gap-4">
              <div className="relative w-1/2 lg:h-[420px]">
                <Webcam
                  className="w-full h-full object-cover rounded-lg"
                  ref={videoRef}
                  videoConstraints={{
                    width: 1280,
                    height: 720,
                    facingMode: "user",
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                />
              </div>
              <div className="relative w-1/1 lg:h-[480px]">
                <MeadiaStream signText={dmessage} callObject={callObject} session={session} loading={loading} />
              </div>
            </div>
          </div>
      }
      <div className="w-full flex justify-center py-4 bg-gray-100">
        {started ? (
          <button
            className="text-white bg-[#EF4444] hover:bg-[#EF4444-500 transition-all py-2 px-8 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            onClick={() => leaveConversation()}
            aria-label="Stop the webcam"
          >
            Leave Conversation
          </button>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            textAlign: 'center',
            position: 'absolute',
            top: '0%',
            color: 'white', // Default text color
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)', // Text shadow for contrast
          }}>
            <Grow in={checked} style={{ transformOrigin: '0 0 0' }} {...(checked ? { timeout: 3000 } : {})}>
              <h1 style={{ fontSize: '25px', marginBottom: '10px' }}>
                Where Technology Meets Everyone
              </h1>
            </Grow>
            <Grow in={checked} style={{ transformOrigin: '0 0 0' }} {...(checked ? { timeout: 6000 } : {})}>
              <p style={{ marginBottom: '20px' }}>
                Connecting People and Technology
              </p>
            </Grow>
            <Grow in={checked} style={{ transformOrigin: '0 0 0' }} {...(checked ? { timeout: 10000 } : {})}>
              <Button
                style={{
                  marginTop: '20px',
                  backgroundColor: 'hsl(206.4, 100%, 42%)',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transition: 'background-color 0.3s',
                }}
                onClick={enableCam}
                onMouseEnter={(e) => e.currentTarget.style.width = '60%'}
                onMouseLeave={(e) => e.currentTarget.style.width = '55%'}
                aria-label="Start the conversation"
              >
                Start Conversation
              </Button>
            </Grow>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversation;
