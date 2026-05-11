import React from 'react';
import { MapPin, FileText, Download } from 'lucide-react';
import { Document, Page } from 'react-pdf';
import AudioPlayer from './AudioPlayer';
import { useCachedFile } from '../hooks/useCachedFile';

interface MessageAttachmentProps {
  attachment: {
    type: string;
    url: string;
    name: string;
    size?: string;
  };
  isMe: boolean;
  setPreviewFile: (file: any) => void;
}

export default function MessageAttachment({ attachment, isMe, setPreviewFile }: MessageAttachmentProps) {
  const isLocation = attachment.type === 'location/gps';
  const { localUrl, isError } = useCachedFile(isLocation ? undefined : attachment.url);
  const displayUrl = localUrl || attachment.url;

  if (isLocation) {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className={`mt-1 mb-2 flex items-center gap-3 p-3 rounded-xl border ${isMe ? 'border-indigo-400/30 bg-indigo-500/20' : 'border-slate-200 bg-white'} max-w-sm hover:opacity-90 transition-all group/file ${isMe ? 'flex-row-reverse' : ''}`}>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-indigo-400/30 text-indigo-100' : 'bg-teal-50 text-teal-600'}`}>
          <MapPin size={20} />
        </div>
        <div className={`flex-1 min-w-0 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
          <p className={`text-xs font-bold truncate ${isMe ? 'text-white' : 'text-slate-900'}`}>Shared Location</p>
          <p className={`text-[10px] font-medium truncate ${isMe ? 'text-indigo-200' : 'text-slate-500'}`}>{attachment.size}</p>
        </div>
        <div className={`shrink-0 transition-colors ${isMe ? 'text-indigo-300 group-hover/file:text-white' : 'text-slate-300 group-hover/file:text-teal-600'}`}>
          <span className="text-[10px] font-bold tracking-widest uppercase relative -top-[2px]">Open</span>
        </div>
      </a>
    );
  }

  if (attachment.type.startsWith('video/')) {
    return (
      <div className={`mt-1 mb-2 rounded-xl border ${isMe ? 'border-indigo-400/30' : 'border-slate-200'} bg-black/5 overflow-hidden max-w-[280px] shadow-sm flex`}>
        {isError ? (
          <div className="p-4 text-xs font-medium text-slate-500">Video Expired or Unavailable</div>
        ) : (
          <video src={displayUrl} controls className="w-full h-auto max-h-[300px]" />
        )}
      </div>
    );
  }

  if (attachment.type.startsWith('image/')) {
    return (
      <div className={`mt-1 mb-2 rounded-xl border ${isMe ? 'border-indigo-400/30' : 'border-slate-200'} bg-black/5 overflow-hidden max-w-[280px] shadow-sm cursor-pointer hover:opacity-90 transition-opacity flex`} onClick={() => setPreviewFile({url: displayUrl, type: attachment.type, name: attachment.name})}>
        {isError ? (
          <div className="p-4 text-xs font-medium text-slate-500">Image Expired or Unavailable</div>
        ) : (
          <img src={displayUrl} alt={attachment.name} className="w-full h-auto object-cover max-h-[300px]" />
        )}
      </div>
    );
  }

  if (attachment.type.startsWith('audio/')) {
    return (
      <div className={`mt-1 mb-2 rounded-xl border ${isMe ? 'border-indigo-400/30 bg-indigo-500/20' : 'border-slate-200 bg-slate-50'} p-3 shadow-sm max-w-[280px] flex flex-col`}>
        {isError ? (
          <div className="text-xs font-medium text-slate-500">Audio Expired or Unavailable</div>
        ) : (
          <AudioPlayer src={displayUrl} isMe={isMe} />
        )}
      </div>
    );
  }

  if (attachment.type === 'application/pdf') {
    return (
      <div onClick={() => !isError && setPreviewFile({url: displayUrl, type: attachment.type, name: attachment.name})} className={`mt-1 mb-2 rounded-xl border overflow-hidden max-w-[280px] cursor-pointer group/doc shadow-sm flex flex-col ${isMe ? 'border-indigo-400/30 bg-indigo-500/20' : 'border-slate-200 bg-slate-50'}`}>
        <div className="h-40 overflow-hidden bg-white/90 relative pointer-events-none flex items-start justify-center">
          {isError ? (
             <div className="h-40 w-full flex items-center justify-center bg-transparent"><span className="text-xs font-medium text-slate-500">PDF Expired</span></div>
          ) : (
            <Document 
              file={displayUrl} 
              loading={<div className="h-40 w-full flex items-center justify-center bg-transparent"><div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${isMe ? 'border-indigo-200' : 'border-slate-400'}`}></div></div>}
            >
              <Page pageNumber={1} width={280} renderTextLayer={false} renderAnnotationLayer={false} className="shadow-none !bg-transparent" />
            </Document>
          )}
          <div className={`absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t ${isMe ? 'from-indigo-600' : 'from-white'} to-transparent opacity-50`} />
        </div>
        <div className={`p-3 relative z-10 border-t ${isMe ? 'bg-indigo-500/40 border-indigo-400/30 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'} mt-[-2px] flex flex-col items-start`}>
          <div className="flex flex-col gap-1 w-full text-left">
              <p className="text-sm font-medium truncate">{attachment.name}</p>
              <div className={`text-[11px] flex items-center gap-1.5 ${isMe ? 'text-indigo-100' : 'text-slate-500'}`}>
                <span>PDF</span>
                <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                <span>{attachment?.size || 'Unknown size'}</span>
              </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={() => !isError && setPreviewFile({url: displayUrl, type: attachment.type, name: attachment.name})} className={`mt-1 mb-2 flex items-center gap-3 p-3 rounded-xl border ${isMe ? 'border-indigo-400/30 bg-indigo-500/20' : 'border-slate-200 bg-white'} max-w-sm hover:opacity-90 transition-all cursor-pointer group/file ${isMe ? 'flex-row-reverse' : ''}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-indigo-400/30 text-indigo-100' : 'bg-indigo-50 text-indigo-600'}`}>
        <FileText size={20} />
      </div>
      <div className={`flex-1 min-w-0 flex flex-col ${isMe ? 'items-end' : 'text-left'}`}>
        <p className={`text-xs font-bold truncate ${isMe ? 'text-white' : 'text-slate-900'}`}>{attachment.name}</p>
        <p className={`text-[10px] font-medium ${isMe ? 'text-indigo-200' : 'text-slate-500'}`}>{attachment.size}</p>
        {isError && <p className={`text-[10px] font-medium text-rose-500 mt-0.5`}>File Expired</p>}
      </div>
      {!isError && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            const a = document.createElement('a');
            a.href = displayUrl;
            a.download = attachment.name;
            a.target = '_blank';
            a.click();
          }}
          className={`shrink-0 p-1.5 rounded-full hover:bg-black/5 transition-colors ${isMe ? 'text-indigo-300 hover:text-white' : 'text-slate-400 hover:text-indigo-600'}`}
        >
          <Download size={16} />
        </div>
      )}
    </div>
  );
}
