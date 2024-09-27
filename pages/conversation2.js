import React, { useEffect, useRef, useState } from "react";
import MeadiaStream from "../compnents/meadiaStream";
import Webcam from "react-webcam";
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";
import { DrawingUtils } from "@mediapipe/tasks-vision";
import { useSnackbar } from "notistack";
import { useCallObject } from "@daily-co/daily-react";
import { useRouter } from "next/router";
import { FaCheckCircle } from "react-icons/fa";
import { AiOutlineLogin, AiOutlineLoading3Quarters } from "react-icons/ai";

let gestureRecognizer;
let runningMode = "VIDEO";
let webcamRunning = false;

const Conversation = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [handSensorLoaded, setHandSensorLoaded] = useState(false);
  const [dmessage, setMessage] = useState("");
  const [conversationId, setConversationId] = useState(false);
  let prev = "";
  const [started, setStarted] = useState(false);
  const [checked, setChecked] = useState(true);
  const [session, setSession] = useState({
    id: "",
    name: "",
  });
  const [cameraPermission, setCameraPermission] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  let callObject = useCallObject({
    options: {
      startAudioOff: false,
      userName: "Ajay",
    },
  });

  async function HandlJoin({ conversation_url }) {
    setLoading(true);
    console.log("===---", conversation_url);
    try {
      const res = await callObject?.join({ url: conversation_url });

      console.log(res, "res");
      setLoading(false);
      setTimeout(() => {
        Object.values(callObject.participants()).forEach((user) => {
          console.log(callObject.participants(), "part", user);
          if (user.owner) {
            setSession({
              id: user.session_id,
              name: user.user_name,
            });
            setStarted(true);
            setJoining(false);
          }
        });
      }, 3000);
      enqueueSnackbar("Successfully joined", { variant: "success" });
    } catch (error) {
      console.log(error);
      enqueueSnackbar(error.message, { variant: "error" });
      setLoading(false);
    }
  }

  useEffect(() => {
    navigator.permissions
      .query({ name: "camera" })
      .then((permission) => {
        setCameraPermission(permission.state === "granted");
      })
      .catch((error) => {
        console.error("Permission error: ", error);
      });

    return () => {
      const stream = videoRef?.current?.srcObject;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    setTimeout(() => setChecked(true), 500);
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
      setHandSensorLoaded(true);
    };

    loadGestureRecognizer();

    return () => {
      if (webcamRunning) {
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
      enqueueSnackbar("Gesture Recognizer is not present", {
        variant: "error",
      });

      return;
    }
    setJoining(true);
    makeConversation();

    webcamRunning = !webcamRunning;
    const constraints = { video: true };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      // videoRef.current.play();
      setTimeout(() => predictWebcam(), 5000);
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
            //   `Gesture: ${categoryName}, Confidence: ${categoryScore}%`
            // );
          }
        }
      }

      if (webcamRunning) {
        requestAnimationFrame(predictWebcam);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const makeConversation = async () => {
    setLoading(true);
    const url = "https://tavusapi.com/v2/conversations";
    const apiKey = "f181ad861a6c415fac24418c195f27a7";

    const data = {
      replica_id: "rfb51183fe",
      persona_id: "p88964a7",
      callback_url:
        "https://4nkzzc8g-3000.inc1.devtunnels.ms/api/chat/completions",
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
      setConversationId(responseData.conversation_id);
      console.log(responseData);
      setTimeout(() => {
        HandlJoin(responseData);
      }, 2000);
    } catch (error) {
      setLoading(false);
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
      router.push("/");
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-900 text-white gap-4 flex-row">
      {/* Container */}

      <div className="flex justify-center w-11/12 gap-12 align-middle">
        {started && (
          <div className="relative w-4/5 h-80 rounded-md">
            <MeadiaStream
              signText={dmessage}
              callObject={callObject}
              session={session}
              loading={!started}
            />
          </div>
        )}
        <div
          className={`${
            started ? "w-2/5" : "w-1/3 min-w-[400px] bg-gray-800 shadow-lg"
          }  rounded-xl mt-24 ${
            started
              ? "p-0 flex flex-col align-middle justify-center"
              : "px-8 py-6"
          }`}
        >
          {/* Header */}
          {!started && (
            <header className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-semibold tracking-wide">
                Join the Conversation
              </h1>
              <button
                className={`${
                  cameraPermission && handSensorLoaded && !joining
                    ? "bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500"
                    : "bg-gray-600 cursor-not-allowed"
                } text-white py-2 px-5 rounded-md shadow-md transition-transform duration-300 transform hover:scale-105 flex items-center space-x-2`}
                onClick={enableCam}
                disabled={!cameraPermission || !handSensorLoaded || joining}
              >
                <>
                  <span>Enter</span>
                  <AiOutlineLogin className="text-xl" />
                </>
              </button>
            </header>
          )}
          {/* Camera Preview */}
          <div
            className={`w-full h-48 bg-gray-700 rounded-md overflow-hidden relative  shadow-md flex items-center justify-center ${
              started ? "mb-0 h-60" : "mb-6"
            }`}
          >
            {cameraPermission ? (
              <>
                <Webcam
                  className="absolute top-0 left-0 w-full h-full object-cover"
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
              </>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-lg font-medium">Camera Access Required</p>
              </div>
            )}
          </div>

          {/* Checklist Section */}
          {!started && (
            <div className="space-y-4">
              {/* Camera Permission Check */}
              <div className="flex items-center justify-between bg-gray-700 p-4 rounded-md shadow-md h-16">
                <span className="text-sm">Allow Camera Access</span>
                {cameraPermission ? (
                  <FaCheckCircle className="text-green-500 text-2xl" />
                ) : (
                  <FaCheckCircle className="text-grey-500 text-2xl" />
                )}
              </div>

              {/* Hand Motion Sensor Check */}
              <div className="flex items-center justify-between bg-gray-700 p-4 rounded-md shadow-md h-16">
                <span className="text-sm">Loading Hand Motion Sensor</span>
                {handSensorLoaded ? (
                  <FaCheckCircle className="text-green-500 text-2xl" />
                ) : (
                  <AiOutlineLoading3Quarters className="text-yellow-500 text-2xl animate-spin" />
                )}
              </div>
            </div>
          )}
          {started && (
            <footer className="mt-6 flex justify-center">
              <button
                className="bg-red-500 hover:bg-red-600 py-3 px-8 rounded-md shadow-md focus:outline-none transition-transform duration-300 transform hover:scale-105 text-lg font-semibold"
                onClick={leaveConversation}
              >
                Leave Conversation
              </button>
            </footer>
          )}
          {/* Footer */}
        </div>
      </div>
    </div>
  );
};

export default Conversation;
