
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, RotateCw, Maximize2, Minimize2 } from 'lucide-react';
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
  const [isMaximized, setIsMaximized] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
      // Remove scrollbar and use FitV to fit the page vertically
      const newSrc = `${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0&view=FitV&zoom=${scale}${rotationParam}`;
      iframeRef.current.src = newSrc;
    }
  }, [pdfUrl, currentPage, scale, rotation]);

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
  }, [onContainerDimensionsChange, isMaximized]);

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
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      console.log('Previous page:', newPage);
    }
  };

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    console.log('Rotating PDF to:', newRotation + '°');
  };

  const handleToggleMaximize = () => {
    setIsMaximized(!isMaximized);
    console.log('PDF viewer', isMaximized ? 'minimized' : 'maximized');
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

  const containerHeight = isMaximized ? '90vh' : '700px';

  return (
    <Card className={`bg-white border-gray-200 ${className} ${isMaximized ? 'fixed inset-4 z-50' : ''}`}>
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
            <Button variant="outline" size="sm" onClick={handleToggleMaximize}>
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
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
          style={{ height: containerHeight }}
        >
          {pdfUrl && (
            <div className="relative w-full h-full">
              <iframe
                ref={iframeRef}
                src={`${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0&view=FitV&zoom=${scale}${rotation ? `&rotate=${rotation}` : ''}`}
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
                    containerHeight={isMaximized ? window.innerHeight * 0.9 - 100 : 700}
                    scale={scale / 100}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Maximize overlay close button */}
        {isMaximized && (
          <div className="absolute top-2 right-2">
            <Button variant="outline" size="sm" onClick={handleToggleMaximize}>
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PDFViewer;
