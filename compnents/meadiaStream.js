import { useRef, useEffect, useState, memo } from 'react';
import { DailyProvider, useCallObject, DailyVideo, DailyAudio } from '@daily-co/daily-react';
import getAudioContext from 'audio-context';

export default memo(() => {
    const [text, setText] = useState('');
  const [audioContext, setAudioContext] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [mediaStreamTrack, setMediaStreamTrack] = useState(null);
  const audioContextRef = useRef(null);
  const callRef = useRef(null);

  let callObject = useCallObject({
    options: {
        audioSource: mediaStreamTrack,
        startAudioOff: false,
        url: "https://tavus.daily.co/c99cd967",
        userName: "Ajay",
    },
});

async function HandlJoin(){
    const res = await callObject?.join({url: 'https://tavus.daily.co/c99cd967'})   
    console.log(res)
    console.log(callObject)
}

  useEffect(() => {
    const context = getAudioContext();
    audioContextRef.current = context;
    // Create an initial MediaStream
    const destination = context.createMediaStreamDestination();
    setMediaStream(destination.stream);
    // setMediaStreamTrack(destination.stream.getAudioTracks()[0]);
    // console.log(callRef, "--------")
    setSessionId(callObject?.participants()?.local?.session_id)
    // Cleanup
    return () => {
      context.close();
    };
  }, []);
  

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const speakText = () => {
    if (!audioContextRef.current || !text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const destination = audioContextRef.current.createMediaStreamDestination();
    
    // Create a MediaStreamSource for the new audio
    const source = audioContextRef.current.createMediaStreamSource(destination.stream);
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

    window.speechSynthesis.speak(utterance);
  };
  return (
    <div>
    <DailyProvider callObject={callObject} >
      <div ref={callRef} />
      <DailyVideo style={{width: '50%'}} sessionId={callObject?.participants()?.local?.session_id}/>
      <DailyVideo style={{width: '50%'}} sessionId="253a93ac-1915-44d3-a82b-a3c4686f6c29" />
      <DailyAudio  />
    </DailyProvider>
    <div>
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Type your text here"
      />
      <button onClick={speakText}>Speak</button>
      <button onClick={HandlJoin}>Join</button>
      {mediaStreamTrack && <p>Current Track ID: {mediaStreamTrack.id}test---{callObject?.participants()?.local?.session_id}</p>}
    </div>
    </div>
  );
});
