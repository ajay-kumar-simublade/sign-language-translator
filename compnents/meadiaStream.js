import { useRef, useEffect, useState } from "react";
import { DailyProvider, DailyVideo, DailyAudio } from "@daily-co/daily-react";
import getAudioContext from "audio-context";
import { CallEvents } from "./EventListener";

export default ({ signText, session, callObject, loading }) => {
  const [mediaStream, setMediaStream] = useState(null);

  const audioContextRef = useRef(null);
  const callRef = useRef(null);

  useEffect(() => {
    speakText();
  }, [signText]);

  useEffect(() => {
    const context = getAudioContext();
    audioContextRef.current = context;
    // Create an initial MediaStream
    const destination = context.createMediaStreamDestination();
    setMediaStream(destination.stream);
    // Cleanup
    return () => {
      callObject?.leave();
      context?.close();
    };
  }, []);

  const speakText = () => {
    if (!audioContextRef.current || !signText) return;

    const utterance = new SpeechSynthesisUtterance(signText);
    const destination = audioContextRef.current.createMediaStreamDestination();

    // Create a MediaStreamSource for the new audio
    const source = audioContextRef.current.createMediaStreamSource(
      destination.stream,
    );
    source.connect(audioContextRef.current.destination);

    // Connect the new track to the existing media stream
    const newTrack = destination.stream.getAudioTracks()[0];

    // Update the media stream with the new track without replacing it entirely
    if (mediaStream) {
      mediaStream.addTrack(newTrack);
    }

    // Speak the text
    utterance.onend = () => {
      window.speechSynthesis.cancel();
    };

    utterance.pitch = 0.9; // Increase pitch to 1.5, adjust as needed

// Set the rate (0.1 to 10, where 1 is the default)
utterance.rate = 0.9; // Default rate, adjust as needed

// Optionally, set the voice
const voices = window.speechSynthesis.getVoices();
console.log(voices)
utterance.voice = voices.find(voice => voice.name === "Reed (English (United States))"
); // Example voice

// Speak the utterance
window.speechSynthesis.speak(utterance);
    // window.speechSynthesis.speak(utterance);
  };
  return (
    <>
      {loading ? (
        <h4>Loading....</h4>
      ) : (
        <DailyProvider callObject={callObject} sty>
          <div ref={callRef} className="relative w-full">
            <DailyAudio />
            <DailyVideo
              sessionId={session?.id}
              className="w-full h-full rounded-md"
            />
            <CallEvents />
          </div>
        </DailyProvider>
      )}
    </>
  );
};
