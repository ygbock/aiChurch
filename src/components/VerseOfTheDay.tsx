import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VerseOfTheDay() {
  const [verse, setVerse] = useState<{ text: string; reference: string; translation_name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Array of predefined verses to choose from based on the day of the year
    const versesList = [
      'John 3:16', 'Romans 8:28', 'Philippians 4:13', 'Proverbs 3:5-6', 'Isaiah 41:10',
      'Psalms 23:1', 'Jeremiah 29:11', 'Psalms 46:1', 'Romans 12:2', 'Psalms 119:105',
      'Hebrews 11:1', '1 Corinthians 13:4-7', '2 Timothy 1:7', 'Joshua 1:9', 'Isaiah 40:31'
    ];
    
    const resolveVerse = async () => {
      try {
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 0);
        const diff = today.getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        
        const reference = versesList[dayOfYear % versesList.length];
        
        const cachedVerseStr = localStorage.getItem('verseOfTheDay');
        if (cachedVerseStr) {
           const cachedVerse = JSON.parse(cachedVerseStr);
           if (cachedVerse.reference === reference && cachedVerse.date === today.toDateString()) {
              setVerse(cachedVerse.data);
              setLoading(false);
              return;
           }
        }
        
        const res = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}`);
        if (!res.ok) throw new Error('Failed to fetch verse');
        const data = await res.json();
        const verseData = {
           text: data.text.trim(),
           reference: data.reference,
           translation_name: data.translation_name
        };
        setVerse(verseData);
        localStorage.setItem('verseOfTheDay', JSON.stringify({
           reference,
           date: today.toDateString(),
           data: verseData
        }));
      } catch (error) {
        console.error('Error fetching verse of the day:', error);
      } finally {
        setLoading(false);
      }
    };

    resolveVerse();
  }, []);

  if (loading) {
     return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden h-40 flex items-center justify-center">
           <Loader2 className="animate-spin" size={24} />
        </div>
     );
  }

  if (!verse) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
        <Sparkles size={120} />
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm">
          <BookOpen className="text-white" size={24} />
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-bold text-indigo-100 uppercase tracking-widest mb-2 flex items-center gap-2">
            Verse of the Day
          </h3>
          <p className="font-serif text-lg md:text-2xl font-medium leading-relaxed mb-4 text-indigo-50">
            "{verse.text}"
          </p>
          <div className="flex items-center gap-3">
             <span className="font-black tracking-tight text-white">{verse.reference}</span>
             <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
               {verse.translation_name}
             </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
