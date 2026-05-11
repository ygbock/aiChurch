import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface PDFPreviewProps {
  url: string;
}

export default function PDFPreview({ url }: PDFPreviewProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError(err: Error): void {
    console.error("PDF load error:", err);
    setError(err.message);
    setLoading(false);
  }

  const previousPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const nextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));

  return (
    <div className="flex flex-col items-center w-full h-full p-4 overflow-y-auto bg-slate-100 rounded-lg relative group">
      {loading && !error && (
        <div className="flex items-center justify-center p-10">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      )}
      {error && (
        <div className="text-center text-rose-500 p-4">
          Failed to load PDF preview: {error}
        </div>
      )}
      {!loading && !error && (
        <div className="shadow-lg bg-white mt-4 max-w-full overflow-hidden relative">
          <Document 
              file={url} 
              onLoadSuccess={onDocumentLoadSuccess} 
              onLoadError={onDocumentLoadError}
              loading={null}
          >
            <Page 
               pageNumber={pageNumber} 
               renderTextLayer={false} 
               renderAnnotationLayer={false} 
               width={Math.min(window.innerWidth - 64, 800)}
               className="max-w-full transition-opacity duration-300"
            />
          </Document>
          
          {/* Internal Navigation Controls overlay for better UX */}
          {numPages && numPages > 1 && (
            <>
              <button 
                onClick={previousPage} 
                disabled={pageNumber <= 1}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all disabled:opacity-0 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={nextPage} 
                disabled={pageNumber >= numPages}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all disabled:opacity-0 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
      )}

      {numPages && numPages > 0 && (
        <div className="mt-4 flex items-center justify-center gap-4 bg-white px-4 py-2 rounded-full shadow-sm text-sm font-medium text-slate-600">
           <button 
              onClick={previousPage}
              disabled={pageNumber <= 1}
              className="p-1 hover:bg-slate-100 rounded-full disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} />
           </button>
           <span className="min-w-[80px] text-center">Page {pageNumber} of {numPages}</span>
           <button 
              onClick={nextPage}
              disabled={pageNumber >= numPages}
              className="p-1 hover:bg-slate-100 rounded-full disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
           </button>
        </div>
      )}
    </div>
  );
}
