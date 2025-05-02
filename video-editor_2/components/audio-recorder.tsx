import React, { useEffect, useRef, useState } from 'react';

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void;
}

export default function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioChunks = useRef<Blob[]>([]);

    useEffect(() => {
        if (!isRecording) return;

        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.current.push(e.data);
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                audioChunks.current = [];
                setAudioUrl(URL.createObjectURL(audioBlob));
                onRecordingComplete(audioBlob);
                stream.getTracks().forEach((track) => track.stop());
            };

            recorder.start();
        });
    }, [isRecording, onRecordingComplete]);

    const handleStop = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        setIsRecording(false);
    };

    return (
        <div>
            <div className="space-x-2">
                {!isRecording ? (
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                        onClick={() => setIsRecording(true)}
                    >
                        Start Recording
                    </button>
                ) : (
                    <button
                        className="bg-red-600 text-white px-4 py-2 rounded"
                        onClick={handleStop}
                    >
                        Stop Recording
                    </button>
                )}
            </div>
        </div>
    );
};

// export default AudioRecorder;