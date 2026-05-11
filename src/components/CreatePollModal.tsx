import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PollDraft {
  question: string;
  options: { id: string; text: string }[];
  allowMultipleAnswers: boolean;
}

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (poll: PollDraft) => void;
}

export default function CreatePollModal({ isOpen, onClose, onSubmit }: CreatePollModalProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([{ id: '1', text: '' }, { id: '2', text: '' }]);
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleOptionChange = (id: string, text: string) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
    setErrorMsg('');
  };

  const addOption = () => {
    setOptions([...options, { id: Math.random().toString(36).substr(2, 9), text: '' }]);
  };

  const handleSubmit = () => {
    const validOptions = options.filter(opt => opt.text.trim() !== '');
    if (!question.trim() || validOptions.length < 2) {
      setErrorMsg('Please provide a question and at least two options.');
      return;
    }
    onSubmit({
      question: question.trim(),
      options: validOptions,
      allowMultipleAnswers
    });
    setQuestion('');
    setOptions([{ id: '1', text: '' }, { id: '2', text: '' }]);
    setAllowMultipleAnswers(false);
    setErrorMsg('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 z-[200] flex flex-col justify-end lg:justify-center items-center backdrop-blur-sm">
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="w-full max-w-md bg-[#111b21] lg:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center gap-4 p-4 border-b border-white/10 shrink-0">
            <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-white flex-1">Create poll</h2>
          </div>

          <div className="p-4 flex-1 overflow-y-auto no-scrollbar flex flex-col gap-6">
            {/* Question */}
            <div className="flex flex-col gap-2">
              <label className="text-[#00a884] text-sm font-semibold">Question</label>
              <input 
                type="text"
                placeholder="Ask question (Required)"
                value={question}
                onChange={e => { setQuestion(e.target.value); setErrorMsg(''); }}
                className="w-full bg-transparent border border-[#00a884] rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#00a884]"
              />
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2">
              <label className="text-slate-400 text-sm font-semibold">Options</label>
              <div className="flex flex-col gap-3">
                {options.map((opt, index) => (
                  <div key={opt.id} className="relative">
                    <input 
                      type="text"
                      placeholder={`+ Add`}
                      value={opt.text}
                      onChange={e => handleOptionChange(opt.id, e.target.value)}
                      className="w-full bg-transparent border border-white/20 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-white/40 pr-10"
                    />
                    {options.length > 2 && (
                      <button 
                        onClick={() => setOptions(options.filter(o => o.id !== opt.id))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-rose-400"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {options.length < 12 && (
                  <button 
                    onClick={addOption}
                    className="w-full text-left bg-transparent border border-white/20 rounded-lg p-3 text-slate-500 focus:outline-none hover:border-white/40"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>

            {/* Allow multiple options */}
            <div className="flex items-center justify-between py-4 border-t border-white/10 mt-auto">
              <span className="text-white font-medium">Allow multiple answers</span>
              <button 
                onClick={() => setAllowMultipleAnswers(!allowMultipleAnswers)}
                className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${allowMultipleAnswers ? 'bg-[#00a884]' : 'bg-slate-600'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${allowMultipleAnswers ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Submit */}
          {errorMsg && <div className="p-3 bg-rose-500/10 border-t border-rose-500/20 text-rose-500 font-medium text-center text-sm w-full animate-pulse flex-shrink-0">{errorMsg}</div>}
          <div className="p-4 border-t border-white/10 flex justify-end shrink-0">
            <button 
              onClick={handleSubmit}
              className="w-12 h-12 bg-[#00a884] rounded-full flex items-center justify-center text-white hover:bg-[#008f6f] disabled:opacity-50 disabled:hover:bg-[#00a884] transition-colors shadow-lg"
            >
              <Send size={20} className="ml-1" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
