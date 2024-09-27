import React, { useEffect, useRef, useState } from "react";

import Head from "next/head";
import Webcam from "react-webcam";
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";
import { DrawingUtils } from "@mediapipe/tasks-vision";
import MeadiaStream from "../compnents/meadiaStream";

let gestureRecognizer;
let runningMode = "VIDEO";
let webcamRunning = false;

const Conversation = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [dmessage, setMessage] = useState("");
  let prev = "";

  useEffect(() => {
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
    makeConversation();

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

          console.log(
            `Gesture: ${categoryName}, Confidence: ${categoryScore}%`
          );
        }
      }
    }

    if (webcamRunning) {
      requestAnimationFrame(predictWebcam);
    }
  }

  const makeConversation = async () => {
    const options = {
      method: "POST",
      headers: {
        "x-api-key": "<api-key>",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        replica_id: "r79e1c033f",
        persona_id: "p5317866",
        callback_url: "http://localhost:3002",
        conversation_name: "A Meeting with Hassaan",
        conversational_context:
          "You are about to talk to Hassaan, one of the cofounders of Tavus. He loves to talk about AI, startups, and racing cars.",
        custom_greeting: "Hey there Hassaan, long time no see!",
        properties: {
          max_call_duration: 3600,
          participant_left_timeout: 60,
          enable_recording: true,
          enable_transcription: true,
          recording_s3_bucket_name: "conversation-recordings",
          recording_s3_bucket_region: "us-east-1",
          aws_assume_role_arn: "",
        },
      }),
    };
    try {
      const response = await fetch(
        "https://tavusapi.com/v2/conversations",
        options
      );
      const data = await response.json();
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ error: "Error making API request" });
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-100">
      <div className="w-full bg-blue-400 text-white py-4 px-6 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-semibold">New conversation</h1>
      </div>
      <div className="flex-grow w-full h-[70%] flex justify-center items-center p-6 lg:p-5">
        <div className="relative w-full max-w-screen-lg h-full bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
          <Webcam
            audio={false}
            className="w-full h-full object-cover"
            videoConstraints={{
              width: 1280,
              height: 720,
              facingMode: "user",
            }}
          />
        </div>
      </div>

      <div className="flex w-full justify-start px-6 lg:px-10 mb-4">
        <div className="relative w-40 h-24 bg-black rounded-lg overflow-hidden shadow-lg">
          <Webcam
            className="w-full h-full object-cover"
            ref={videoRef}
            videoConstraints={{
              width: 640,
              height: 480,
              facingMode: "user",
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              // top: 0,
              // left: 0,
              width: 640,
              height: 480,
            }}
          />
          <button
            onClick={() => enableCam()}
            className="absolute top-2 right-2 bg-white bg-opacity-30 text-black py-1 px-2 rounded cursor-pointer"
          >
            {webcamRunning ? "Stop" : "Start"}
          </button>
          <h2 className="text-lightsalmon">{dmessage}</h2>
        </div>
      </div>

      <div className="w-full flex justify-center py-6 bg-white border-t border-gray-300 shadow-lg">
        <button
          className="text-white bg-blue-400 hover:bg-blue-500 transition-all py-2 px-8 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          aria-label="Leave the conversation"
        >
          Leave Conversation
        </button>
        {/* <h2 className="text-lightsalmon">{dmessage}</h2> */}
      </div>
    </div>
  );
};

export default Conversation;
