import React from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface Poll {
  question: string;
  options: PollOption[];
  allowMultipleAnswers: boolean;
}

interface PollMessageProps {
  poll: Poll;
  messageId: string;
  chatId: string;
  currentUserId: string;
  isDirectMessage?: boolean;
}

export default function PollMessage({ poll, messageId, chatId, currentUserId, isDirectMessage = false }: PollMessageProps) {
  const collectionName = isDirectMessage ? 'directMessageChats' : 'ministryChannels';
  
  // Calculate total votes for percentage
  const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0);

  const handleVote = async (optionId: string) => {
    try {
      const msgRef = doc(db, collectionName, chatId, 'messages', messageId);
      
      let newOptions = [...poll.options];
      const optionIndex = newOptions.findIndex(o => o.id === optionId);
      if (optionIndex === -1) return;

      const hasVotedForThis = newOptions[optionIndex].votes.includes(currentUserId);

      if (hasVotedForThis) {
        // Remove vote
        newOptions[optionIndex].votes = newOptions[optionIndex].votes.filter(id => id !== currentUserId);
      } else {
        // Add vote
        if (!poll.allowMultipleAnswers) {
          // Remove from other options first
          newOptions = newOptions.map(opt => ({
            ...opt,
            votes: opt.votes.filter(id => id !== currentUserId)
          }));
        }
        
        const newOptionIndex = newOptions.findIndex(o => o.id === optionId);
        newOptions[newOptionIndex].votes.push(currentUserId);
      }

      await updateDoc(msgRef, {
        'poll.options': newOptions
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${chatId}/messages/${messageId}`);
    }
  };

  return (
    <div className="flex flex-col gap-3 min-w-[240px]">
      <div className="flex items-start gap-2">
         {/* Poll icon */}
         <div className="text-[#00a884] shrink-0 mt-0.5">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><path d="M12 16v-6"></path><path d="M8 16v-2"></path><path d="M16 16v-4"></path></svg>
         </div>
         <p className="font-bold text-[15px] leading-snug">{poll.question}</p>
      </div>
      
      <div className="flex flex-col gap-2 w-full mt-1">
        {poll.options.map(opt => {
          const voteCount = opt.votes.length;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const hasVoted = opt.votes.includes(currentUserId);

          return (
            <div 
              key={opt.id} 
              onClick={() => handleVote(opt.id)}
              className="relative rounded-lg overflow-hidden border border-black/5 bg-black/5 p-3 cursor-pointer hover:bg-black/10 transition-colors flex items-center group"
            >
              {/* Progress bar */}
              <div 
                className="absolute left-0 top-0 bottom-0 bg-[#00a884]/20 transition-all duration-500 ease-out z-0"
                style={{ width: `${percentage}%` }}
              />
              
              <div className="flex justify-between items-center w-full relative z-10 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${hasVoted ? 'border-[#00a884] bg-[#00a884]' : 'border-slate-400'}`}>
                    {hasVoted && (
                       <svg viewBox="0 0 24 24" width="10" height="10" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    )}
                  </div>
                  <span className="text-[15px] text-slate-800 truncate">{opt.text}</span>
                </div>
                {voteCount > 0 && (
                   <div className="flex items-center gap-2 shrink-0">
                     <div className="flex -space-x-1.5 mr-1">
                       {/* Ideally show avatars here, but for now just dots or small circles */}
                       {opt.votes.slice(0, 3).map((v, i) => (
                         <div key={v} className="w-4 h-4 rounded-full bg-slate-300 border border-white z-10" />
                       ))}
                     </div>
                     <span className="text-xs font-bold text-slate-500">{voteCount}</span>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="text-xs text-slate-500 mt-1 pb-1 border-b border-black/5">
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
      </div>
    </div>
  );
}
