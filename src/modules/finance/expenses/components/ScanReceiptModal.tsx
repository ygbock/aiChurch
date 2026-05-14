import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: ExtractedData) => void;
}

export interface ExtractedData {
  vendorName: string;
  amount: number;
  date: string;
  description: string;
}

export default function ScanReceiptModal({ isOpen, onClose, onComplete }: ScanReceiptModalProps) {
  const [step, setStep] = useState<'upload' | 'scanning' | 'review'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    vendorName: '',
    amount: 0,
    date: '',
    description: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      startScanning();
    }
  };

  const startScanning = () => {
    setStep('scanning');
    // Simulate OCR delay
    setTimeout(() => {
      setExtractedData({
        vendorName: 'TechGear Solutions',
        amount: 4500,
        date: new Date().toISOString().split('T')[0],
        description: 'Camera lens repair and maintenance'
      });
      setStep('review');
    }, 2500);
  };

  const handleReset = () => {
    setFile(null);
    setStep('upload');
  };

  const handleSubmit = () => {
    onComplete(extractedData);
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl flex flex-col overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Smart Receipt OCR</h2>
            <p className="text-sm text-slate-500">Upload a receipt or invoice to auto-fill details.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 'upload' && (
              <motion.div 
                key="upload"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-4 bg-slate-100 text-slate-500 rounded-full mb-4">
                  <Upload size={32} />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Upload Receipt or Invoice</h3>
                <p className="text-sm text-slate-500 mb-6">Drag and drop or click to browse (PDF, JPG, PNG)</p>
                <button className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                  Select File
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                />
              </motion.div>
            )}

            {step === 'scanning' && (
              <motion.div 
                key="scanning"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="py-16 flex flex-col items-center justify-center text-center"
              >
                <div className="relative mb-6 text-emerald-600">
                  <FileText size={64} className="opacity-20" />
                  <Loader2 size={32} className="animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Analyzing Document...</h3>
                <p className="text-sm text-slate-500">Extracting vendor details, amount, and date.</p>
                <div className="w-48 h-1 bg-slate-100 rounded-full mt-6 overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: '100%' }}
                     transition={{ duration: 2.5 }}
                     className="h-full bg-emerald-500"
                   />
                </div>
              </motion.div>
            )}

            {step === 'review' && (
              <motion.div 
                key="review"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl text-emerald-700">
                  <CheckCircle2 size={24} className="shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">Scan Successful</h4>
                    <p className="text-xs opacity-80">Please review the extracted data and make adjustments if needed.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor / Payee</label>
                    <input 
                      type="text" 
                      value={extractedData.vendorName}
                      onChange={(e) => setExtractedData({...extractedData, vendorName: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500 font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount (Le)</label>
                      <input 
                        type="number" 
                        value={extractedData.amount}
                        onChange={(e) => setExtractedData({...extractedData, amount: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500 font-bold text-emerald-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
                      <input 
                        type="date" 
                        value={extractedData.date}
                        onChange={(e) => setExtractedData({...extractedData, date: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                    <input 
                      type="text" 
                      value={extractedData.description}
                      onChange={(e) => setExtractedData({...extractedData, description: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button 
                     onClick={handleReset}
                     className="px-4 py-2 text-slate-600 font-medium rounded-lg hover:bg-slate-100 text-sm transition-colors flex items-center gap-2"
                  >
                    <RefreshCw size={16} /> Rescan
                  </button>
                  <button 
                     onClick={handleSubmit}
                     className="flex-1 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Use These Details
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
