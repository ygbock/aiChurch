import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';

export default function FloatingActionMenu({ actions }: { actions: { icon: React.ReactNode, label: string, onClick: () => void }[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="flex flex-col gap-2 items-end mb-2 pointer-events-auto"
          >
            {actions.map((action, i) => (
              <motion.button 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { action.onClick(); setIsOpen(false); }}
                className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] border border-slate-100 hover:bg-slate-50 transition-all duration-300 group"
              >
                <span className="text-sm font-bold text-slate-700 whitespace-nowrap">{action.label}</span>
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {action.icon}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl shadow-blue-200 flex items-center justify-center hover:bg-blue-700 transition-colors pointer-events-auto"
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }}>
          <Plus size={24} />
        </motion.div>
      </button>
    </div>
  );
}
