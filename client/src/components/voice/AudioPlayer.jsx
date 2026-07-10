import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

export default function AudioPlayer({ src, base64, className = "" }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    let url = src;
    
    if (base64) {
      try {
        const parts = base64.split('|');
        let ext = 'webm';
        let pureBase64 = base64;
        if (parts.length > 1) {
          ext = parts[0];
          pureBase64 = parts[1];
        }
        
        // Convert base64 to binary blob
        const binaryString = atob(pureBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: `audio/${ext}` });
        url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
      } catch (e) {
        console.error("Failed to parse base64 audio", e);
        // Fallback to data URI directly
        url = `data:audio/webm;base64,${base64}`;
      }
    }

    if (url) {
      const audio = new Audio(url);
      audioRef.current = audio;

      const onLoadedMetadata = () => {
        setDuration(audio.duration || 0);
      };

      const onTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const onEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('ended', onEnded);

      // Trigger metadata load manually if it's already cached or loading
      if (audio.readyState >= 1) {
        setDuration(audio.duration || 0);
      }

      return () => {
        audio.pause();
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('ended', onEnded);
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
      };
    }
  }, [src, base64]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.error("Audio play failed:", err));
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || duration === 0) return;
    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl w-full ${className}`}>
      <button
        onClick={togglePlay}
        type="button"
        className="w-9 h-9 rounded-full bg-slate-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0"
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <input
          type="range"
          min="0"
          max="100"
          value={progressPercent}
          onChange={handleSeek}
          className="w-full h-1 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
          style={{
            background: `linear-gradient(to right, rgb(99 102 241) ${progressPercent}%, rgb(226 232 240) ${progressPercent}%)`
          }}
        />
        <div className="flex justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <button
        onClick={toggleMute}
        type="button"
        className="p-1.5 text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white transition-colors shrink-0"
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
