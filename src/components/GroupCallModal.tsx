import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, Users, Maximize2, Minimize2 } from 'lucide-react';
import DailyIframe from '@daily-co/daily-js';

interface GroupCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'audio' | 'video';
  channelName?: string;
  participantsCount?: number;
}

export default function GroupCallModal({ isOpen, onClose, type, channelName, participantsCount = 1 }: GroupCallModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callState, setCallState] = useState<'idle' | 'joining' | 'joined' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<any>(null);
  const isGroup = participantsCount > 2;

  useEffect(() => {
    if (isOpen && containerRef.current && !callFrameRef.current) {
      const roomUrl = (import.meta as any).env.VITE_DAILY_ROOM_URL;
      
      if (!roomUrl) {
        setCallState('error');
        return;
      }

      console.log('Attempting to join call at:', roomUrl ? 'Room URL found' : 'MISSING ROOM URL');
      setCallState('joining');

      const timeout = setTimeout(() => {
        if (callState === 'joining') {
          console.warn('Daily join timed out');
          setCallState('error');
        }
      }, 15000); // 15s timeout

      let isMounted = true;
      
      (async () => {
        try {
          // Initialize Daily
          const callFrame = DailyIframe.createFrame(containerRef.current!, {
            iframeStyle: {
              width: '100%',
              height: '100%',
              border: '0',
              borderRadius: '12px'
            },
            showLeaveButton: false,
            showFullscreenButton: true,
          });

          if (!isMounted) {
             callFrame.destroy();
             return;
          }

          callFrameRef.current = callFrame;

          // Event handlers for debugging
          callFrame.on('loading', () => console.log('Daily: Loading...'));
          callFrame.on('loaded', () => console.log('Daily: Loaded'));
          callFrame.on('started-camera', () => console.log('Daily: Camera started'));
          callFrame.on('camera-error', (e) => {
             console.error('Daily Camera Error:', e);
             setErrorMessage(e?.errorMsg || 'Camera error');
          });
          callFrame.on('error', (e) => {
            console.error('Daily Generic Error:', e);
            if (isMounted) {
              setErrorMessage(e?.errorMsg || 'An unknown error occurred');
              setCallState('error');
            }
          });

          await callFrame.join({ 
            url: roomUrl,
            audioSource: true,
            videoSource: type === 'video'
          });
          
          if (!isMounted) return;

          clearTimeout(timeout);
          console.log('Daily: Joined successfully');
          setCallState('joined');
        } catch (err: any) {
          if (!isMounted) return;
          clearTimeout(timeout);
          console.error('Daily Join Error:', err);
          setErrorMessage(err?.message || String(err));
          setCallState('error');
        }

        if (!isMounted) return;

        // Event handlers
        callFrameRef.current?.on('left-meeting', () => {
          onClose();
        });
      })();

      return () => {
        isMounted = false;
        if (callFrameRef.current) {
          callFrameRef.current.destroy();
          callFrameRef.current = null;
        }
      };
    }
  }, [isOpen, type]);

  const handleLeave = async () => {
    if (callFrameRef.current) {
      await callFrameRef.current.leave();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all ${isMaximized ? 'p-0' : 'p-4'}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
          onClick={handleLeave}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            width: isMaximized ? '100%' : '100%',
            height: isMaximized ? '100%' : 'auto',
            maxWidth: isMaximized ? '100%' : '44rem',
          }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative bg-slate-900 overflow-hidden shadow-2xl border border-slate-800 flex flex-col ${isMaximized ? 'rounded-none' : 'rounded-3xl'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between text-white border-b border-white/10 relative z-10 bg-slate-900/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
                {isGroup ? <Users size={20} /> : <Phone size={20} />}
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-tight">{channelName || (isGroup ? 'Group Call' : 'Private Call')}</h3>
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{callState === 'joined' ? 'Connected' : 'Connecting...'}</span>
                  <span className="text-slate-600">•</span>
                  <span>{participantsCount} Participants</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={isMaximized ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button 
                onClick={handleLeave}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
              >
                <PhoneOff size={18} />
              </button>
            </div>
          </div>

          {/* Call Container */}
          <div className={`relative bg-black transition-all ${isMaximized ? 'flex-1' : 'aspect-video'}`}>
            <div ref={containerRef} className="w-full h-full" />
            
            {callState === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
                  <VideoOff size={32} />
                </div>
                <h4 className="text-white font-bold text-lg mb-2">Connection Issue</h4>
                <p className="text-slate-400 text-sm max-w-xs mx-auto mb-2">
                  {errorMessage ? (
                    <span className="text-rose-400 font-medium break-words">{errorMessage}</span>
                  ) : (
                    <>We couldn't connect to the call. Please verify your <b>Daily.co Room URL</b> is correct and active.</>
                  )}
                </p>
                <p className="text-slate-500 text-xs mb-6 italic">
                  Note: If you just updated your environment variables, you may need to restart the application.
                </p>
                <button 
                  onClick={onClose}
                  className="px-6 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {callState === 'joining' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping"></div>
                  <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center relative shadow-xl shadow-indigo-600/30">
                    {type === 'video' ? <Video size={28} className="text-white" /> : <Mic size={28} className="text-white" />}
                  </div>
                </div>
                <div className="text-white font-bold text-lg">Joining Secure Room...</div>
                <div className="text-slate-500 text-sm mt-2">Connecting to encrypted endpoint</div>
              </div>
            )}
          </div>

          {/* Footer Controls (Legacy/Backup) */}
          {callState === 'joined' && !isMaximized && (
            <div className="p-4 bg-slate-900 border-t border-white/5 flex items-center justify-center gap-6">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Real-time Session Active
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

