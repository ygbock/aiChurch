import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare } from 'lucide-react';

interface QuickReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (reply: string) => void;
}

const QUICK_REPLIES = [
  "I'm on my way!",
  "Can I call you later?",
  "Thanks!",
  "Okay, sounds good.",
  "I'll be there in 5 minutes.",
  "Let me check and get back to you.",
  "Yes",
  "No",
  "Can we reschedule?",
  "I'm in a meeting, talk soon."
];

export default function QuickReplyModal({ isOpen, onClose, onSelect }: QuickReplyModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 z-[200] flex justify-center items-end md:items-center p-4 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="bg-white dark:bg-[#111b21] rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/10 shrink-0">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <MessageSquare size={20} className="text-indigo-600 dark:text-indigo-400" />
              Quick Replies
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-2 overflow-y-auto custom-scrollbar">
            <div className="grid gap-2">
              {QUICK_REPLIES.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelect(reply);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-slate-200 text-sm md:text-base border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
