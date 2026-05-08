import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageViewerProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function ImageViewer({ images, currentIndex, isOpen, onClose, onIndexChange }: ImageViewerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) onIndexChange(currentIndex - 1);
      }
      if (e.key === 'ArrowRight') {
        if (currentIndex < images.length - 1) onIndexChange(currentIndex + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose, onIndexChange]);

  if (!isOpen || images.length === 0) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-sm" onClick={onClose}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
        >
          <X size={24} />
        </button>

        {images.length > 1 && currentIndex > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); onIndexChange(currentIndex - 1); }}
            className="absolute left-4 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        <motion.div 
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="relative max-w-[100vw] max-h-[100vh] sm:max-w-[90vw] sm:max-h-[90vh] flex items-center justify-center"
        >
          <img 
            src={images[currentIndex]} 
            alt={`Image ${currentIndex + 1}`} 
            className="w-full h-full object-contain max-h-[100vh] sm:max-h-[90vh]" 
          />
        </motion.div>

        {images.length > 1 && currentIndex < images.length - 1 && (
          <button 
            onClick={(e) => { e.stopPropagation(); onIndexChange(currentIndex + 1); }}
            className="absolute right-4 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
          >
            <ChevronRight size={32} />
          </button>
        )}
        
        {images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    </AnimatePresence>,
    document.body
  );
}
