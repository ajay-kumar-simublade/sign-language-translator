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
  const [conversationId, setConversationId] = useState(true);
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
    const url = "https://tavusapi.com/v2/conversations";
    const apiKey = "f181ad861a6c415fac24418c195f27a7";

    const data = {
      replica_id: "rfb51183fe",
      persona_id: "p88964a7",
      callback_url: "https://eoh7blrwpnctppa.m.pipedream.net",
      conversation_name: "Tets Ajay Test",
    };
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      const responseData = await response.json();
      if (responseData.conversation_id) {
        setConversationId(responseData.conversation_id);
      }
      console.log(responseData);
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
  };

  const leaveConversation = async () => {
    const url = `https://tavusapi.com/v2/conversations/${conversationId}/end`;
    const apiKey = "f181ad861a6c415fac24418c195f27a7";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      });
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      const responseData = await response.json();
      console.log(responseData);
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="w-full bg-gradient-to-br from-[#3B82F6] to-[#6366F1] text-white py-4 px-6 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-semibold">New conversation</h1>
      </div>
      <div className="flex-grow w-full flex justify-center items-center p-6 lg:p-5 bg-gray-100">
        <div className="relative w-full max-w-screen-lg flex h-full gap-4">
          <div className="relative w-1/2 lg:h-[320px]">
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
          <Webcam
            audio={false}
            className="w-1/2 lg:h-[320px] object-cover rounded-lg"
            videoConstraints={{
              width: 1280,
              height: 720,
              facingMode: "user",
            }}
          />
        </div>
      </div>
      <div className="w-full flex justify-center py-4 bg-gray-100">
        {webcamRunning ? (
          <button
            className="text-white bg-[#EF4444] hover:bg-[#EF4444-500 transition-all py-2 px-8 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            onClick={() => leaveConversation()}
            aria-label="Stop the webcam"
          >
            Leave Conversation
          </button>
        ) : (
          <button
            onClick={() => enableCam()}
            className="text-white bg-[#10B981] hover:bg-[#10B981-500 transition-all py-2 px-8 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            aria-label="Leave the conversation"
          >
            Start Conversation
          </button>
        )}
      </div>
    </div>
  );
};

export default Conversation;
