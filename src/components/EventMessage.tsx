import React, { useState } from 'react';
import { Calendar as CalendarIcon, MapPin, Video, CheckCircle2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export interface EventAttachment {
  name: string;
  description: string;
  startTime: string; // ISO string
  endTime: string | null;
  location: string;
  whatsappCallLink: boolean;
  reminder: string;
  allowGuests: boolean;
  attendees: string[]; // array of user IDs
}

interface EventMessageProps {
  event: EventAttachment;
  messageId: string;
  chatId: string;
  currentUserId: string;
  isDirectMessage?: boolean;
}

export default function EventMessage({ event, messageId, chatId, currentUserId, isDirectMessage = false }: EventMessageProps) {
  const collectionName = isDirectMessage ? 'directMessageChats' : 'ministryChannels';
  
  const isAttending = event.attendees?.includes(currentUserId);
  const attendeesCount = event.attendees?.length || 0;

  const handleRSVP = async () => {
    try {
      const msgRef = doc(db, collectionName, chatId, 'messages', messageId);
      
      await updateDoc(msgRef, {
        'event.attendees': isAttending ? arrayRemove(currentUserId) : arrayUnion(currentUserId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${chatId}/messages/${messageId}`);
    }
  };

  const startDate = new Date(event.startTime);
  const month = startDate.toLocaleString('default', { month: 'short' }).toUpperCase();
  const date = startDate.getDate();
  
  const timeString = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTimeString = event.endTime ? ` - ${new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '';

  return (
    <div className="flex flex-col gap-3 min-w-[240px] max-w-[300px]">
      <div className="flex gap-4 p-3 bg-white/60 dark:bg-black/10 rounded-xl border border-black/5">
         <div className="flex flex-col items-center justify-center bg-white dark:bg-[#111b21] rounded-lg min-w-[50px] shrink-0 border border-black/5 shadow-sm overflow-hidden pb-1">
             <div className="bg-rose-500 w-full text-center text-[10px] font-bold text-white py-0.5">{month}</div>
             <div className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">{date}</div>
         </div>
         <div className="flex flex-col flex-1 min-w-0 justify-center">
            <h3 className="font-bold text-[15px] text-slate-900 dark:text-white leading-snug truncate">{event.name}</h3>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{timeString}{endTimeString}</p>
         </div>
      </div>

      {event.description && (
         <p className="text-sm text-slate-800 dark:text-slate-300 px-1 line-clamp-2">{event.description}</p>
      )}

      {(event.location || event.whatsappCallLink) && (
        <div className="flex flex-col gap-2 px-1 mt-1">
           {event.location && (
             <div className="flex items-start gap-2">
                <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600 dark:text-slate-400 leading-snug">{event.location}</span>
             </div>
           )}
           {event.whatsappCallLink && (
             <div className="flex items-center gap-2">
                <Video size={16} className="text-slate-400 shrink-0" />
                <span className="text-sm text-slate-600 dark:text-slate-400">WhatsApp Call</span>
             </div>
           )}
        </div>
      )}

      <div className="w-full h-px bg-black/5 my-1" />

      <div className="flex items-center justify-between px-1">
         <div className="flex -space-x-1.5 h-6 opacity-80">
            {attendeesCount > 0 && Array.from({ length: Math.min(attendeesCount, 3) }).map((_, i) => (
               <div key={i} className="w-6 h-6 rounded-full bg-slate-300 border border-white dark:border-[#111b21]" />
            ))}
         </div>
         <span className="text-xs font-medium text-slate-500 ml-2">
             {attendeesCount} attending
         </span>
         
         <button 
           onClick={handleRSVP}
           className={`ml-auto px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors ${
             isAttending 
               ? 'bg-[#00a884]/10 text-[#00a884]' 
               : 'bg-indigo-600 text-white hover:bg-indigo-700'
           }`}
         >
           {isAttending && <CheckCircle2 size={14} />}
           {isAttending ? 'Attending' : 'Attend'}
         </button>
      </div>

    </div>
  );
}
