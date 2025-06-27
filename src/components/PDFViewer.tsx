
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  onPageChange?: (pageNumber: number) => void;
  className?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  signatures,
  onSignaturePositionChange,
  onSignatureRemove,
  onScaleChange,
  onContainerDimensionsChange,
  onPageChange,
  className = ''
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [scale, setScale] = useState(100); // Changed to percentage
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const viewerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Zoom levels in percentages
  const zoomLevels = [25, 50, 75, 100, 125, 150, 175, 200];

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setIsLoading(false);
      
      // Load PDF to get total pages
      const loadPDF = async () => {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const { PDFDocument } = await import('pdf-lib');
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          setTotalPages(pdfDoc.getPageCount());
        } catch (error) {
          console.error('Error loading PDF:', error);
          setTotalPages(1);
        }
      };
      
      loadPDF();
      
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  // Notify parent component of scale changes (convert percentage to decimal)
  useEffect(() => {
    if (onScaleChange) {
      onScaleChange(scale / 100);
    }
  }, [scale, onScaleChange]);

  // Notify parent component of page changes
  useEffect(() => {
    if (onPageChange) {
      onPageChange(currentPage);
    }
  }, [currentPage, onPageChange]);

  // Update iframe src when page changes
  useEffect(() => {
    if (pdfUrl && iframeRef.current) {
      const newSrc = `${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=${scale}`;
      iframeRef.current.src = newSrc;
    }
  }, [pdfUrl, currentPage, scale]);

  // Listen for scroll events from iframe to detect page changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleIframeLoad = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          const handleScroll = () => {
            // This is a simplified approach - in a real implementation,
            // you might need to use PDF.js or similar library for accurate page detection
            try {
              const scrollTop = iframeDoc.documentElement.scrollTop || iframeDoc.body.scrollTop;
              const scrollHeight = iframeDoc.documentElement.scrollHeight || iframeDoc.body.scrollHeight;
              const clientHeight = iframeDoc.documentElement.clientHeight || iframeDoc.body.clientHeight;
              
              // Estimate current page based on scroll position
              const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
              const estimatedPage = Math.min(Math.ceil(scrollPercentage * totalPages) || 1, totalPages);
              
              if (estimatedPage !== currentPage && estimatedPage >= 1 && estimatedPage <= totalPages) {
                setCurrentPage(estimatedPage);
              }
            } catch (error) {
              // Cross-origin or other access issues
              console.log('Cannot access iframe content for scroll detection');
            }
          };

          iframeDoc.addEventListener('scroll', handleScroll);
          return () => iframeDoc.removeEventListener('scroll', handleScroll);
        }
      } catch (error) {
        // Cross-origin restrictions prevent access
        console.log('Cannot access iframe for scroll events');
      }
    };

    iframe.addEventListener('load', handleIframeLoad);
    return () => iframe.removeEventListener('load', handleIframeLoad);
  }, [currentPage, totalPages]);

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
    const currentIndex = zoomLevels.findIndex(level => level >= scale);
    const nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1);
    setScale(zoomLevels[nextIndex]);
  };

  const handleZoomOut = () => {
    const currentIndex = zoomLevels.findIndex(level => level >= scale);
    const prevIndex = Math.max(currentIndex - 1, 0);
    setScale(zoomLevels[prevIndex]);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleZoomOut}
              disabled={scale <= zoomLevels[0]}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[60px] text-center">{scale}%</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleZoomIn}
              disabled={scale >= zoomLevels[zoomLevels.length - 1]}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 px-2 min-w-[100px] text-center">
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
            <div className="relative w-full h-full">
              <iframe
                ref={iframeRef}
                src={`${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=${scale}`}
                className="w-full h-full border-0"
                title="PDF Preview"
                onLoad={() => {
                  console.log('PDF loaded successfully, page:', currentPage, 'zoom:', scale + '%');
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
                    scale={scale / 100}
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
