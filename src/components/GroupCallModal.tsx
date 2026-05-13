import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, Users, Maximize2, Minimize2, PhoneOff } from 'lucide-react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useFirebase } from './FirebaseProvider';

interface GroupCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'audio' | 'video';
  channelName?: string;
  channelId?: string;
  participantsCount?: number;
  context?: 'direct' | 'channel';
}

export default function GroupCallModal({ isOpen, onClose, type, channelName, channelId, participantsCount = 1, context = 'direct' }: GroupCallModalProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const { user } = useFirebase();
  const isGroup = participantsCount > 2;

  // Clean the channel name to be a valid Jitsi room name
  const safeRoomName = channelId
    ? channelId.replace(/[^a-zA-Z0-9]/g, '')
    : channelName 
      ? channelName.replace(/[^a-zA-Z0-9]/g, '')
      : 'Call';
      
  const contextName = context === 'channel' ? 'GroupClass' : isGroup ? 'GroupChat' : 'Direct';
  const finalRoomName = `FaithFlow-${contextName}-${safeRoomName}`;

  const handleLeave = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-all ${isMaximized ? 'p-0' : 'p-0 md:p-4'}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
          onClick={handleLeave}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative bg-slate-900 overflow-hidden shadow-2xl flex flex-col z-10 transition-all duration-300 ${
            isMaximized 
              ? 'w-full h-[100dvh] rounded-none border-none' 
              : 'w-full h-[100dvh] md:h-auto md:max-w-4xl md:max-h-[90dvh] rounded-none md:rounded-2xl border-none md:border border-slate-800'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between text-white border-b border-white/10 relative z-10 bg-slate-900/50 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20 hidden sm:flex">
                {isGroup ? <Users size={20} /> : <Phone size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm sm:text-base leading-tight truncate">{channelName || (isGroup ? 'Group Call' : 'Private Call')}</h3>
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span>Connected</span>
                  <span className="text-slate-600 shrink-0">•</span>
                  <span>{participantsCount} Participants</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-2">
              <button
                onClick={() => window.open(`https://framatalk.org/${finalRoomName}`, '_blank')}
                className="hidden sm:flex px-3 py-1.5 text-xs font-bold text-indigo-400 bg-indigo-400/10 hover:bg-indigo-400/20 rounded-lg transition-colors items-center gap-1.5"
                title="Open in new tab"
              >
                <Maximize2 size={14} />
                <span className="hidden md:inline">Open in App</span>
              </button>
              <button 
                onClick={() => setIsMaximized(!isMaximized)}
                className="hidden sm:block p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={isMaximized ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button 
                onClick={handleLeave}
                className="p-2 text-rose-400 hover:text-rose-300 bg-rose-400/10 hover:bg-rose-400/20 rounded-lg transition-colors flex items-center gap-2"
                title="Leave Call"
              >
                <PhoneOff size={18} />
                <span className="text-xs font-bold sm:hidden">Leave</span>
              </button>
            </div>
          </div>

          {/* Call Container */}
          <div className={`relative bg-black transition-all overflow-hidden flex-1 ${isMaximized ? 'h-[100dvh]' : 'min-h-0 sm:aspect-video sm:min-h-[400px]'}`}>
              <JitsiMeeting
                domain="framatalk.org"
                roomName={finalRoomName}
                configOverwrite={{
                  startWithAudioMuted: false,
                  startWithVideoMuted: type === 'audio',
                  prejoinPageEnabled: false,
                  prejoinConfig: { enabled: false },
                  disableDeepLinking: true,
                }}
                interfaceConfigOverwrite={{
                 DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                 SHOW_PROMOTIONAL_CLOSE_PAGE: false,
                 SHOW_JITSI_WATERMARK: false,
                 SHOW_BRAND_WATERMARK: false,
               }}
               userInfo={{
                 displayName: user?.displayName || "FaithFlow User",
                 email: user?.email || "user@example.com"
               }}
               onReadyToClose={() => {
                 onClose();
               }}
               getIFrameRef={(iframeRef) => { 
                 iframeRef.style.height = '100%'; 
                 iframeRef.style.width = '100%';
                 iframeRef.style.border = 'none';
                 iframeRef.style.borderRadius = isMaximized ? '0' : '0';
               }}
             />
          </div>
          
          <div className="p-3 bg-slate-900 border-t border-white/10 sm:hidden flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium tracking-wide">Call in progress...</span>
              <button
                onClick={() => window.open(`https://framatalk.org/${finalRoomName}`, '_blank')}
                className="px-3 py-1.5 text-xs font-bold text-indigo-400 bg-indigo-400/10 active:bg-indigo-400/20 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Maximize2 size={12} />
                Open External App
              </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

