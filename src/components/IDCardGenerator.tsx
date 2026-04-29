import React, { useState, useRef } from 'react';
import { Printer, RefreshCw, LayoutTemplate, Shield } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from './Modal';

interface IDCardGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    fullName: string;
    photoUrl?: string;
    level: string;
  };
}

export default function IDCardGenerator({ isOpen, onClose, member }: IDCardGeneratorProps) {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [themeColor, setThemeColor] = useState('blue');
  const [quantity, setQuantity] = useState(1);
  const [layout, setLayout] = useState<'1' | '4'>('1');
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const colors: Record<string, string> = {
    blue: 'bg-[#001f3f]',
    indigo: 'bg-[#1a237e]',
    emerald: 'bg-[#1b5e20]',
    rose: 'bg-[#880e4f]',
  };

  const accentColors: Record<string, string> = {
    blue: 'text-blue-400',
    indigo: 'text-indigo-400',
    emerald: 'text-emerald-400',
    rose: 'text-rose-400',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Member ID Card">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={() => {
              setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait');
              setSide('front');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <LayoutTemplate size={16} />
            {orientation === 'portrait' ? 'Landscape View' : 'Portrait View'}
          </button>
          
          <div className="flex gap-2 items-center">
            <span className="text-sm font-bold text-slate-600">Qty:</span>
            <input type="number" min="1" max="8" value={quantity} onChange={(e) => setQuantity(Math.min(8, Math.max(1, parseInt(e.target.value) || 1)))} className="w-16 p-2 rounded-lg border text-sm" />
            <select value={layout} onChange={(e) => setLayout(e.target.value as '1' | '4')} className="p-2 rounded-lg border text-sm">
              <option value="1">1 Per Page</option>
              <option value="4">4 Per Page</option>
            </select>
          </div>
          
          <div className="flex gap-2 items-center ml-auto">
            {Object.keys(colors).map((color) => (
              <button
                key={color}
                onClick={() => setThemeColor(color)}
                className={`w-6 h-6 rounded-full ${colors[color]} ${themeColor === color ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-center p-8 bg-slate-100 rounded-2xl overflow-hidden min-h-[400px]">
          <div
            ref={printRef}
            id="id-card-element"
            className="w-full h-full"
          >
            <div className="preview-view">
              <div className={`mx-auto ${orientation === 'portrait' ? 'w-[2.125in] h-[3.37in]' : 'w-[3.37in] h-[2.125in]'}`}>
                <Card orientation={orientation} side={side} member={member} themeColor={themeColor} colors={colors} accentColors={accentColors} />
              </div>
            </div>

            <div className={`print-view ${layout === '4' ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-4'}`}>
              {Array.from({ length: quantity }).map((_, i) => (
                  <div key={i} className={`mx-auto ${orientation === 'portrait' ? 'w-[2.125in] h-[3.37in]' : 'w-[3.37in] h-[2.125in]'}`}>
                     <Card orientation={orientation} side="front" member={member} themeColor={themeColor} colors={colors} accentColors={accentColors} />
                     <Card orientation={orientation} side="back" member={member} themeColor={themeColor} colors={colors} accentColors={accentColors} />
                  </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setSide(side === 'front' ? 'back' : 'front')}
            className="py-3 px-4 border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors text-sm"
          >
            <RefreshCw size={18} />
            Flip Card
          </button>
          <button
            onClick={handlePrint}
            className="py-3 px-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors text-sm shadow-lg shadow-slate-900/10"
          >
            <Printer size={18} />
            Print Card
          </button>
        </div>
      </div>
      
      <style>{`
        .clip-path-header {
          clip-path: polygon(0 0, 100% 0, 100% 85%, 0% 100%);
        }
        .clip-path-footer {
          clip-path: polygon(0 15%, 100% 0, 100% 100%, 0% 100%);
        }
        
        .preview-view { display: block; }
        .print-view { display: none; }
        
        @media print {
          @page {
            size: ${orientation === 'portrait' ? 'auto' : 'landscape'};
            margin: 0.25in;
          }
          body * { visibility: hidden; }
          #id-card-element, #id-card-element * { visibility: visible; }
          
          .preview-view { display: none !important; }
          .print-view { 
            display: grid !important; 
            grid-template-columns: ${layout === '4' ? 'repeat(2, 1fr)' : '1fr'}; 
            gap: 0.25in;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          #id-card-element {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </Modal>
  );
}

function Card({ orientation, side, member, themeColor, colors, accentColors }: any) {
  return (
    <div className={`relative overflow-hidden bg-white text-slate-900 shadow-2xl rounded-[1.25rem] w-full h-full`}>
      <div className={`h-full ${side === 'front' ? 'block' : 'hidden'}`}>
        {orientation === 'portrait' ? (
          <div className="h-full flex flex-col relative">
            <div className={`absolute top-0 left-0 w-full h-2/5 ${colors[themeColor]} clip-path-header`} />
            <div className="relative z-10 p-4 h-full flex flex-col items-center">
              <div className="flex flex-col items-center mb-6">
                <div className="flex items-center gap-1.5 mb-1">
                  <Shield size={14} className="text-white" />
                  <span className="text-[10px] font-black text-white tracking-[0.2em]">FAITH CONNECT</span>
                </div>
              </div>
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full border-[3px] border-[#D4AF37] p-1.5 bg-white shadow-lg overflow-hidden">
                  <img
                    src={member.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=random`}
                    alt={member.fullName}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              <div className="text-center w-full space-y-2">
                <div>
                  <h2 className="text-[#D4AF37] font-black text-[8px] uppercase tracking-widest mb-0.5">NAME</h2>
                  <p className="text-sm font-black text-slate-800 tracking-tight leading-tight uppercase truncate px-2">{member.fullName}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{member.level}</p>
                </div>
                <div className="flex flex-col gap-1.5 text-left items-center">
                  <div className="flex justify-between w-full max-w-[140px] border-b border-slate-100 pb-1">
                    <span className="text-[7px] font-bold text-slate-400 uppercase">ID NO</span>
                    <span className="text-[7px] font-mono font-black text-slate-700">FC-M-2026-004</span>
                  </div>
                  <div className="flex justify-between w-full max-w-[140px] border-b border-slate-100 pb-1">
                    <span className="text-[7px] font-bold text-slate-400 uppercase">JOINED</span>
                    <span className="text-[7px] font-black text-slate-700">JAN 1, 2026</span>
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-4 flex flex-col items-center">
                <div className="flex items-end gap-[1px] h-6 mb-1 opacity-80">
                  {[1, 2, 1, 3, 2, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 2, 1, 3, 2, 1, 2, 1].map((w, i) => (
                    <div key={i} className="bg-slate-900" style={{ width: `${w}px`, height: '100%' }} />
                  ))}
                </div>
                <span className="text-[6px] font-mono font-bold tracking-[0.3em] text-slate-400">FAITH-CONNECT-2026</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col relative">
            <div className={`absolute top-0 left-0 w-full h-2/5 ${colors[themeColor]} overflow-hidden`}>
              <div className="absolute inset-0 opacity-20 flex">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex-1 skew-x-[30deg] bg-white/20 translate-x-2 translate-y-4" />
                ))}
              </div>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <Shield size={16} className="text-white" />
                  <span className="text-xs font-black text-white tracking-[0.1em]">FAITH CONNECT</span>
                </div>
                <p className="text-[8px] font-bold text-white/60 tracking-widest uppercase">Member Identity</p>
              </div>
            </div>
            <div className="relative z-10 h-full p-4 flex">
              <div className="flex flex-col pt-4">
                <div className="w-24 h-24 rounded-full border-[3px] border-white p-1 bg-white shadow-xl overflow-hidden mt-2 ml-2">
                  <img
                    src={member.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=random`}
                    alt={member.fullName}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div className="mt-auto pl-4 pb-2 space-y-1">
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="text-[6px] font-bold text-slate-400 uppercase">ID No</p>
                      <p className="text-[8px] font-black text-slate-800">FC-M-2026-004</p>
                    </div>
                    <div>
                      <p className="text-[6px] font-bold text-slate-400 uppercase">Joined Date</p>
                      <p className="text-[8px] font-black text-slate-800">01/01/2026</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col pt-16 pl-6">
                <div className="mb-auto">
                  <h2 className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tight truncate">{member.fullName}</h2>
                  <p className={`text-[10px] font-bold ${accentColors[themeColor]} uppercase tracking-widest`}>{member.level}</p>
                </div>
                <div className="mt-auto flex flex-col items-end pb-2">
                  <div className="text-center mb-2 px-4 shadow-sm border border-slate-50 bg-slate-50/50 rounded-lg py-1">
                    <p className="text-[5px] text-slate-400 font-bold uppercase mb-0.5">Authenticated By</p>
                    <div className="w-24 h-4 border-b border-slate-300 font-script text-[10px] italic flex items-center justify-center text-slate-700">Church Admin</div>
                  </div>
                  <div className="flex items-end gap-[1px] h-8 opacity-90 px-2 bg-white rounded-sm border border-slate-100">
                    {[1, 2, 1, 3, 2, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 1, 2, 1, 3, 2, 1, 4, 2, 1, 1, 2, 1].map((w, i) => (
                      <div key={i} className="bg-black" style={{ width: `${w}px`, height: '100%' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className={`h-full ${side === 'back' ? 'block' : 'hidden'}`}>
        <div className="h-full flex flex-col relative bg-slate-50">
          <div className={`absolute bottom-0 right-0 w-full h-2/3 ${colors[themeColor]} clip-path-footer opacity-10`} />
          <div className={`relative z-10 h-full p-6 flex flex-col items-center text-center ${orientation === 'landscape' ? 'flex-row gap-12 text-left' : ''}`}>
            <div className={`flex flex-col ${orientation === 'landscape' ? 'items-start flex-1' : 'items-center'}`}>
              <div className="flex items-center gap-2 mb-6">
                <div className={`w-8 h-8 rounded-lg ${colors[themeColor]} flex items-center justify-center`}>
                  <Shield size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-[8px] font-black tracking-widest leading-none">FAITH CONNECT</p>
                  <p className="text-[6px] font-bold text-slate-400 tracking-tighter uppercase">Verified Member Identity</p>
                </div>
              </div>
              <div className="space-y-4 mb-4">
                <p className={`text-[8px] font-bold text-slate-500 leading-relaxed ${orientation === 'landscape' ? 'max-w-xs' : 'max-w-[140px]'}`}>
                  This identity card remains the property of Faith Connect. If found, please return to any branch or nearest police station.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white p-3 rounded-2xl shadow-xl mb-4 relative overflow-hidden">
                <QRCodeSVG
                  value={`https://faithconnect.app/verify/${member.fullName?.replace(/\s+/g, '-').toLowerCase()}`}
                  size={orientation === 'landscape' ? 90 : 80}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <span className="text-[6px] font-mono font-bold tracking-[0.3em] text-slate-400">SECURE-VERIFICATION-2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
