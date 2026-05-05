import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Camera, CheckCircle, Check, ScanLine } from 'lucide-react';
import { useZxing } from 'react-zxing';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
  subtitle?: string;
  requireManualEntry?: boolean;
}

export default function ScannerModal({ isOpen, onClose, onScan, title = "Universal Scanner", subtitle = "Scan QR or Barcode", requireManualEntry = true }: ScannerModalProps) {
  const [manualInput, setManualInput] = useState('');
  const [isScanning, setIsScanning] = useState(true);

  const { ref: zxingRef } = useZxing({
    onDecodeResult(result) {
      onScan(result.getText().trim());
      setManualInput('');
      onClose();
    },
    paused: !isOpen || !isScanning,
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all font-bold text-xl z-[101]"
        >
          <X size={24} />
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-800 rounded-[2rem] p-6 sm:p-8 max-w-lg w-full text-center relative overflow-hidden flex flex-col items-center shadow-2xl border border-slate-700/50"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <ScanLine size={32} />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight mb-2">
            {title}
          </h2>
          <p className="text-slate-400 text-sm font-medium mb-8">
            {subtitle}
          </p>

          <div className="w-full flex-1 mb-8" style={{ minHeight: '260px' }}>
            <div className="relative w-full max-w-[260px] mx-auto aspect-square rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center shadow-inner">
              <video ref={zxingRef} className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 pointer-events-none border-[3px] border-emerald-500/30 m-4 rounded-xl overflow-hidden">
                 <motion.div
                   animate={{ top: ["0%", "calc(100% - 4px)", "0%"] }}
                   transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                   className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                 />
              </div>

              <div className="absolute inset-x-8 inset-y-8 pointer-events-none">
                 <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl -ml-1 -mt-1"></div>
                 <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl -mr-1 -mt-1"></div>
                 <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl -ml-1 -mb-1"></div>
                 <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl -mr-1 -mb-1"></div>
              </div>
            </div>
          </div>

          {requireManualEntry && (
            <div className="w-full relative">
              <form onSubmit={(e) => {
                e.preventDefault();
                if (manualInput.trim()) {
                  onScan(manualInput.trim());
                  setManualInput('');
                  onClose();
                }
              }}>
                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  value={manualInput} 
                  onChange={e => setManualInput(e.target.value)} 
                  placeholder="Or enter ID manually..." 
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-5 py-4 pl-14 text-white text-center focus:outline-none focus:border-emerald-500 focus:bg-slate-900 transition-all placeholder:text-slate-500 font-bold tracking-widest text-lg"
                />
              </form>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
