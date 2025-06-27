
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
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
  const [scale, setScale] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [rotation, setRotation] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scrollCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Zoom levels in percentages - more granular control
  const zoomLevels = [10, 25, 50, 75, 100, 125, 150, 175, 200, 250, 300, 400, 500];

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

  // Update iframe src when page, scale, or rotation changes
  useEffect(() => {
    if (pdfUrl && iframeRef.current) {
      const rotationParam = rotation ? `&rotate=${rotation}` : '';
      const newSrc = `${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=${scale}${rotationParam}`;
      iframeRef.current.src = newSrc;
    }
  }, [pdfUrl, currentPage, scale, rotation]);

  // Enhanced scroll detection for page changes
  const detectCurrentPage = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        const scrollTop = iframeDoc.documentElement.scrollTop || iframeDoc.body.scrollTop;
        const scrollHeight = iframeDoc.documentElement.scrollHeight || iframeDoc.body.scrollHeight;
        const clientHeight = iframeDoc.documentElement.clientHeight || iframeDoc.body.clientHeight;
        
        if (scrollHeight > clientHeight) {
          // Calculate current page based on scroll position
          const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
          const estimatedPage = Math.max(1, Math.min(Math.ceil((scrollPercentage * totalPages) + 0.3), totalPages));
          
          if (estimatedPage !== currentPage && estimatedPage >= 1 && estimatedPage <= totalPages) {
            console.log('Page changed via scroll:', estimatedPage);
            setCurrentPage(estimatedPage);
          }
        }
      }
    } catch (error) {
      // Cross-origin restrictions prevent access
      console.log('Cannot access iframe content for scroll detection');
    }
  }, [currentPage, totalPages]);

  // Set up scroll detection
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const setupScrollDetection = () => {
      // Clear existing interval
      if (scrollCheckIntervalRef.current) {
        clearInterval(scrollCheckIntervalRef.current);
      }

      // Set up periodic scroll checking
      scrollCheckIntervalRef.current = setInterval(detectCurrentPage, 500);
      
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          const handleScroll = () => detectCurrentPage();
          iframeDoc.addEventListener('scroll', handleScroll);
          
          return () => {
            iframeDoc.removeEventListener('scroll', handleScroll);
            if (scrollCheckIntervalRef.current) {
              clearInterval(scrollCheckIntervalRef.current);
            }
          };
        }
      } catch (error) {
        console.log('Cannot access iframe for direct scroll events, using interval method');
      }
    };

    iframe.addEventListener('load', setupScrollDetection);
    
    return () => {
      iframe.removeEventListener('load', setupScrollDetection);
      if (scrollCheckIntervalRef.current) {
        clearInterval(scrollCheckIntervalRef.current);
      }
    };
  }, [detectCurrentPage]);

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
    if (nextIndex > currentIndex) {
      setScale(zoomLevels[nextIndex]);
      console.log('Zooming in to:', zoomLevels[nextIndex] + '%');
    }
  };

  const handleZoomOut = () => {
    const currentIndex = zoomLevels.findIndex(level => level >= scale);
    const prevIndex = Math.max(currentIndex - 1, 0);
    if (prevIndex < currentIndex) {
      setScale(zoomLevels[prevIndex]);
      console.log('Zooming out to:', zoomLevels[prevIndex] + '%');
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      console.log('Next page:', newPage);
      
      // Force iframe to navigate to specific page
      if (iframeRef.current && pdfUrl) {
        const rotationParam = rotation ? `&rotate=${rotation}` : '';
        iframeRef.current.src = `${pdfUrl}#page=${newPage}&toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=${scale}${rotationParam}`;
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      console.log('Previous page:', newPage);
      
      // Force iframe to navigate to specific page
      if (iframeRef.current && pdfUrl) {
        const rotationParam = rotation ? `&rotate=${rotation}` : '';
        iframeRef.current.src = `${pdfUrl}#page=${newPage}&toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=${scale}${rotationParam}`;
      }
    }
  };

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    console.log('Rotating PDF to:', newRotation + '°');
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

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
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
                src={`${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=${scale}${rotation ? `&rotate=${rotation}` : ''}`}
                className="w-full h-full border-0"
                title="PDF Preview"
                onLoad={() => {
                  console.log('PDF loaded successfully, page:', currentPage, 'zoom:', scale + '%', 'rotation:', rotation + '°');
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
