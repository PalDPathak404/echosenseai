import { useState, useRef, useEffect } from 'react';
import { AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import RecordingButton from './RecordingButton';
import AudioPlayer from './AudioPlayer';

export default function VoiceRecorder({ onSubmit, onReset, processing }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [time, setTime] = useState(0);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    let timer;
    if (recording) {
      timer = setInterval(() => {
        setTime(t => {
          if (t >= 20) {
            stopRecording();
            return t;
          }
          return t + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [recording]);

  const startRecording = async () => {
    try {
      setRecording(true);
      setError(null);
      setTime(0);
      setAudioBlob(null);
      setAudioUrl(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.resolvedMimeType = mimeType;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const generatedMimeType = mediaRecorder.resolvedMimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: generatedMimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop all tracks on the stream to release the mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("Microphone Access Error:", err);
      setError(`Microphone access error: ${err.message || "Please allow access to leave feedback."}`);
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const handleSubmit = () => {
    if (audioBlob) {
      onSubmit(audioBlob);
    }
  };

  const handleReRecord = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTime(0);
    setError(null);
    if (onReset) onReset();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-6">
      {error && (
        <div className="flex items-center gap-3 text-rose-600 bg-rose-50 border border-rose-100 p-4 rounded-xl text-sm text-left w-full">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {!audioBlob ? (
        <div className="flex flex-col items-center space-y-4">
          <RecordingButton
            isRecording={recording}
            onClick={recording ? stopRecording : startRecording}
            disabled={processing}
          />
          <div className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {recording ? (
              <span className="text-rose-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                00:{time.toString().padStart(2, '0')} / 00:20
              </span>
            ) : "Tap to Speak (Up to 20s)"}
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center space-y-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Preview Your Recording</span>
          <AudioPlayer src={audioUrl} />
          
          <div className="flex gap-3 w-full max-w-md pt-2">
            <button
              onClick={handleReRecord}
              disabled={processing}
              type="button"
              className="flex-1 h-11 rounded-xl border border-border text-foreground text-xs font-bold hover:bg-secondary/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-record
            </button>
            <button
              onClick={handleSubmit}
              disabled={processing}
              type="button"
              className="flex-1 h-11 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold hover:bg-slate-800 dark:hover:bg-zinc-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {processing ? 'Analyzing...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
