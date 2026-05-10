import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2 } from 'lucide-react';
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

  return (
    <div className="flex flex-col items-center w-full h-full p-4 overflow-y-auto bg-slate-100 rounded-lg">
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
      <div className="shadow-lg bg-white mt-4 max-w-full overflow-hidden">
        <Document 
            file={url} 
            onLoadSuccess={onDocumentLoadSuccess} 
            onLoadError={onDocumentLoadError}
            loading={null}
        >
          <Page 
             pageNumber={1} 
             renderTextLayer={false} 
             renderAnnotationLayer={false} 
             width={Math.min(window.innerWidth - 64, 800)}
             className="max-w-full"
          />
        </Document>
      </div>
      {numPages && numPages > 1 && (
        <p className="mt-4 text-xs text-slate-500 font-medium">Page 1 of {numPages}</p>
      )}
    </div>
  );
}
