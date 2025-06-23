
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import DraggableSignature from './DraggableSignature';

interface PDFViewerProps {
  file: File;
  signatures: Array<{ id: string; signature: string; x: number; y: number; pageNumber: number }>;
  onSignaturePositionChange: (id: string, x: number, y: number) => void;
  onSignatureRemove: (id: string) => void;
  className?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  signatures,
  onSignaturePositionChange,
  onSignatureRemove,
  className = ''
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [scale, setScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = file.name;
      link.click();
    }
  };

  return (
    <Card className={`bg-white border-gray-200 ${className}`}>
      <CardContent className="p-4">
        {/* PDF Controls */}
        <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF Viewer Container */}
        <div 
          ref={viewerRef}
          className="relative w-full bg-gray-100 rounded-lg overflow-auto border border-gray-200"
          style={{ height: '600px' }}
        >
          {pdfUrl && (
            <div className="relative" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <iframe
                src={`${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full border-0"
                style={{ minHeight: '800px', width: '100%' }}
                title="PDF Preview"
                onLoad={(e) => {
                  // Try to get total pages (this is limited in iframe)
                  console.log('PDF loaded in viewer');
                }}
              />
              
              {/* Signature Overlays */}
              {signatures
                .filter(sig => sig.pageNumber === currentPage)
                .map((sig) => (
                  <DraggableSignature
                    key={sig.id}
                    signature={sig.signature}
                    initialX={sig.x}
                    initialY={sig.y}
                    onPositionChange={(x, y) => onSignaturePositionChange(sig.id, x, y)}
                    onRemove={() => onSignatureRemove(sig.id)}
                    containerWidth={viewerRef.current?.clientWidth || 800}
                    containerHeight={600}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Page Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PDFViewer;
