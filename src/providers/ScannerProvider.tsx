import React, { createContext, useContext, useState, ReactNode } from 'react';
import ScannerModal from '../components/ScannerModal';

interface ScannerContextType {
  openScanner: (options: {
    title?: string;
    subtitle?: string;
    requireManualEntry?: boolean;
    onScan: (result: string) => void;
  }) => void;
  closeScanner: () => void;
}

const ScannerContext = createContext<ScannerContextType | undefined>(undefined);

export function useScanner() {
  const context = useContext(ScannerContext);
  if (!context) throw new Error('useScanner must be used within ScannerProvider');
  return context;
}

export function ScannerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title?: string;
    subtitle?: string;
    requireManualEntry?: boolean;
    onScan: (result: string) => void;
  } | null>(null);

  const openScanner = (options: any) => {
    setConfig(options);
    setIsOpen(true);
  };

  const closeScanner = () => {
    setIsOpen(false);
    // Allow animation to finish before clearing config
    setTimeout(() => setConfig(null), 300);
  };

  return (
    <ScannerContext.Provider value={{ openScanner, closeScanner }}>
      {children}
      {config && (
        <ScannerModal
          isOpen={isOpen}
          onClose={closeScanner}
          onScan={config.onScan}
          title={config.title}
          subtitle={config.subtitle}
          requireManualEntry={config.requireManualEntry}
        />
      )}
    </ScannerContext.Provider>
  );
}
