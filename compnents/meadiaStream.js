import { useRef, useEffect, useState } from 'react';
import { DailyProvider, DailyVideo, DailyAudio } from '@daily-co/daily-react';
import getAudioContext from 'audio-context';

export default ({ signText, session, callObject, loading }) => {

    const [mediaStream, setMediaStream] = useState(null);
    
    console.log(signText, "=====", session)
    const audioContextRef = useRef(null);
    const callRef = useRef(null);

    

    useEffect(() => {
        console.log(signText, "-------")
        speakText()
    }, [signText])

    useEffect(() => {
        const context = getAudioContext();
        audioContextRef.current = context;
        // Create an initial MediaStream
        const destination = context.createMediaStreamDestination();
        setMediaStream(destination.stream);
        // Cleanup
        return () => {
            callObject?.leave()
            context?.close();
        };
    }, []);

    const speakText = () => {
        if (!audioContextRef.current || !signText) return;

        const utterance = new SpeechSynthesisUtterance(signText);
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
        < >
            {loading ? <h4>Loading....</h4> :
                <DailyProvider callObject={callObject} sty>
                    <div ref={callRef} />
                    {/* <DailyVideo style={{ width: '50%' }} sessionId={callObject?.participants()?.local?.session_id} /> */}
                    <DailyVideo width={640} height={480}  sessionId={session?.id} />
                    <DailyAudio />
                </DailyProvider>
            }
        </>
    );
};
