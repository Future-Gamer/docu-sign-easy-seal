import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import DraggableSignature from './DraggableSignature';

interface PDFViewerProps {
  file: File;
  signatures: Array<{ id: string; signature: string; x: number; y: number; pageNumber: number }>;
  onSignaturePositionChange: (id: string, x: number, y: number) => void;
  onSignatureRemove: (id: string) => void;
  onScaleChange?: (scale: number) => void;
  onContainerDimensionsChange?: (dimensions: { width: number; height: number }) => void;
  className?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  signatures,
  onSignaturePositionChange,
  onSignatureRemove,
  onScaleChange,
  onContainerDimensionsChange,
  className = ''
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [scale, setScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const viewerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setIsLoading(false);
      
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  // Notify parent component of scale changes
  useEffect(() => {
    if (onScaleChange) {
      onScaleChange(scale);
    }
  }, [scale, onScaleChange]);

  // Notify parent component of container dimension changes
  useEffect(() => {
    const updateContainerDimensions = () => {
      if (viewerRef.current && onContainerDimensionsChange) {
        const rect = viewerRef.current.getBoundingClientRect();
        onContainerDimensionsChange({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateContainerDimensions();
    
    // Listen for resize events
    window.addEventListener('resize', updateContainerDimensions);
    
    return () => {
      window.removeEventListener('resize', updateContainerDimensions);
    };
  }, [onContainerDimensionsChange]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = file.name;
      link.click();
    }
  };

  if (isLoading) {
    return (
      <Card className={`bg-white border-gray-200 ${className}`}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading PDF...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white border-gray-200 ${className}`}>
      <CardContent className="p-4">
        {/* PDF Controls */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* PDF Viewer Container */}
        <div 
          ref={viewerRef}
          className="relative w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
          style={{ height: '700px' }}
        >
          {pdfUrl && (
            <div 
              className="relative w-full h-full" 
              style={{ 
                transform: `scale(${scale})`, 
                transformOrigin: 'top left',
                width: `${100 / scale}%`,
                height: `${100 / scale}%`
              }}
            >
              <iframe
                ref={iframeRef}
                src={`${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                className="w-full h-full border-0"
                title="PDF Preview"
                onLoad={() => {
                  console.log('PDF loaded successfully');
                  setTotalPages(5); // Default estimate
                }}
              />
              
              {/* Signature Overlays for current page */}
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
                    containerHeight={700}
                    scale={scale}
                  />
                ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFViewer;
