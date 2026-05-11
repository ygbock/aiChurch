import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  isMe?: boolean;
}

export default function AudioPlayer({ src, isMe = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
    };

    const setAudioTime = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const seekTo = (Number(e.target.value) / 100) * duration;
    audio.currentTime = seekTo;
    setProgress(Number(e.target.value));
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className={`flex items-center gap-3 w-full min-w-[200px]`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <button 
        onClick={togglePlayPause}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-sm ${
          isMe 
            ? 'bg-[#00a884] hover:bg-[#008f6f] text-white' 
            : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-600'
        }`}
      >
        {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-1" />}
      </button>

      <div className="flex-1 flex flex-col justify-center pt-2">
        {/* Progress Slider */}
        <div className="relative w-full h-4 flex items-center group">
            <input 
              type="range"
              min="0"
              max="100"
              value={progress || 0}
              onChange={handleSeek}
              className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10`}
            />
            {/* Visual Track */}
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isMe ? 'bg-[#005c4b]/30' : 'bg-slate-200'}`}>
                <div 
                  className={`h-full ${isMe ? 'bg-white' : 'bg-indigo-500'}`} 
                  style={{ width: `${progress}%` }} 
                />
            </div>
            {/* Thumb */}
            <div 
                className={`absolute w-3 h-3 rounded-full shadow-sm pointer-events-none transition-all ${isMe ? 'bg-white' : 'bg-indigo-500'} scale-0 group-hover:scale-100`}
                style={{ left: `calc(${progress}% - 6px)` }}
            />
        </div>
        <div className={`text-[10px] font-medium flex justify-between mt-1 ${isMe ? 'text-indigo-100' : 'text-slate-400'}`}>
           <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
           <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
