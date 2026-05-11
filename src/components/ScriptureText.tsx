import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X, Loader2 } from 'lucide-react';

// Regex to match Bible verses
const BIBLE_REGEX = /(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1\s*Samuel|2\s*Samuel|1\s*Kings|2\s*Kings|1\s*Chronicles|2\s*Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song\s*of\s*Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1\s*Corinthians|2\s*Corinthians|Galatians|Ephesians|Philippians|Colossians|1\s*Thessalonians|2\s*Thessalonians|1\s*Timothy|2\s*Timothy|Titus|Philemon|Hebrews|James|1\s*Peter|2\s*Peter|1\s*John|2\s*John|3\s*John|Jude|Revelation)\s+\d+:\d+(-\d+)?/gi;

interface FormattedMessageTextProps {
  content: string;
  isMe: boolean;
  mentionedName?: string;
  onScriptureClick?: (reference: string) => void;
}

export function FormattedMessageText({ content, isMe, mentionedName, onScriptureClick }: FormattedMessageTextProps) {
  if (!content) return null;

  // First split by mentions (simplified)
  let elements: (string | React.ReactNode)[] = [content];
  
  if (mentionedName && content.includes(`@${mentionedName}`)) {
     elements = [];
     const parts = content.split(`@${mentionedName}`);
     parts.forEach((part, i) => {
        elements.push(part);
        if (i < parts.length - 1) {
           elements.push(
              <span key={`mention-${i}`} className={`font-bold px-1.5 py-0.5 rounded-md ${isMe ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'}`}>
                @{mentionedName}
              </span>
           );
        }
     });
  }

  // Now process scripture references
  const finalElements = elements.map((element, i) => {
    if (typeof element === 'string') {
      const parts = [];
      let lastIndex = 0;
      let match;
      BIBLE_REGEX.lastIndex = 0; // Reset regex
      
      while ((match = BIBLE_REGEX.exec(element)) !== null) {
        if (match.index > lastIndex) {
          parts.push(element.substring(lastIndex, match.index));
        }
        
        const reference = match[0];
        parts.push(
          <button
             key={`scripture-${i}-${match.index}`}
             onClick={(e) => {
               e.stopPropagation();
               if (onScriptureClick) onScriptureClick(reference);
             }}
             className={`font-semibold underline decoration-2 underline-offset-2 transition-colors ${isMe ? 'text-white decoration-white/30 hover:decoration-white/80' : 'text-indigo-600 decoration-indigo-200 hover:decoration-indigo-500'}`}
          >
             {reference}
          </button>
        );
        lastIndex = match.index + reference.length;
      }
      
      if (lastIndex < element.length) {
        parts.push(element.substring(lastIndex));
      }
      
      return parts.length > 0 ? parts : element;
    }
    return element;
  });

  return <>{finalElements}</>;
}

export function ScriptureModal({ reference, isOpen, onClose }: { reference: string | null; isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !reference) return;
    
    let isMounted = true;
    setLoading(true);
    setError(null);
    setText(null);

    fetch(`https://bible-api.com/${encodeURIComponent(reference)}`)
      .then(res => {
         if (!res.ok) throw new Error('Scripture not found');
         return res.json();
      })
      .then(data => {
         if (isMounted) {
            setText(data.text);
            setTranslation(data.translation_name);
            setLoading(false);
         }
      })
      .catch(err => {
         if (isMounted) {
            setError(err.message);
            setLoading(false);
         }
      });
      
    return () => { isMounted = false; };
  }, [reference, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && reference && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50 text-emerald-900">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                   <BookOpen size={20} className="text-emerald-700" />
                 </div>
                 <div>
                   <h3 className="font-black text-lg">{reference}</h3>
                   {translation && <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">{translation}</p>}
                 </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-emerald-100 rounded-full transition-colors text-emerald-700">
                 <X size={20} />
               </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
               {loading ? (
                 <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                   <Loader2 size={32} className="animate-spin text-emerald-500 mb-4" />
                   <p className="text-sm font-medium">Looking up scripture...</p>
                 </div>
               ) : error ? (
                 <div className="py-8 text-center">
                   <p className="text-rose-500 font-medium">{error}</p>
                   <p className="text-sm text-slate-500 mt-2">Could not load the requested verse.</p>
                 </div>
               ) : (
                 <div className="prose prose-slate prose-em:text-emerald-800 prose-headings:font-black">
                   <p className="text-lg leading-relaxed text-slate-700 font-medium">{text}</p>
                 </div>
               )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
