import { useRef, useEffect, useState, memo } from 'react';
import { DailyProvider, useCallObject, DailyVideo, DailyAudio } from '@daily-co/daily-react';
import getAudioContext from 'audio-context';
import Button from '@mui/material/Button';
import { useSnackbar } from 'notistack';

export default ({ signText, enableSignLanguage }) => {
    const { enqueueSnackbar } = useSnackbar();

    const [text, setText] = useState('');
    const [loading, setLoading] = useState(null);
    const [mediaStream, setMediaStream] = useState(null);
    const [notify, setNotify] = useState(null);
    const [session, setSession] = useState({
        id: "",
        name: ""
    });
    console.log(signText, "=====")
    const [mediaStreamTrack, setMediaStreamTrack] = useState(null);
    const audioContextRef = useRef(null);
    const callRef = useRef(null);

    let callObject = useCallObject({
        options: {
            audioSource: mediaStreamTrack,
            startAudioOff: false,
            url: "https://tavus.daily.co/cb6d89e1",
            userName: "Ajay",
        },
    });

    useEffect(() => {
        console.log(signText, "-------")
        speakText()
    }, [signText])

    async function HandlJoin() {
        setLoading(true)
        try {
            await callObject?.leave()
            const res = await callObject?.join({ url: 'https://tavus.daily.co/cb6d89e1' })
            setLoading(false)
            enableSignLanguage()
            setTimeout(() => {
                Object.values(callObject.participants()).forEach(user => {
                console.log(callObject.participants())
                    if (user.owner) {
                        setSession({
                            id: user.session_id,
                            name: user.user_name
                        })
                    }
                })
            }, 2000);
            enqueueSnackbar('Successfully joined', {variant: 'success'})
        } catch (error) {
            enqueueSnackbar(error.message, {variant: 'error'})
          setLoading(false)  
        }
    }

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


    const handleTextChange = (e) => {
        setText(e.target.value);
    };

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
        <div>
            {loading ? <h4>Loading....</h4> :
                <DailyProvider callObject={callObject} >
                    <div ref={callRef} />
                    {/* <DailyVideo style={{ width: '50%' }} sessionId={callObject?.participants()?.local?.session_id} /> */}
                    <DailyVideo style={{ width: '100%', height: '100%' }} sessionId={session?.id} />
                    <DailyAudio />
                </DailyProvider>
            }
            <Button onClick={() => HandlJoin()} variant="contained">Create Conversation</Button>
        </div>
    );
};
