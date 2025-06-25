
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Move, Edit3 } from 'lucide-react';

interface DraggableFieldProps {
  id: string;
  type: string;
  label: string;
  initialX: number;
  initialY: number;
  width?: number;
  height?: number;
  onPositionChange: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  onEdit?: (id: string) => void;
  containerWidth?: number;
  containerHeight?: number;
  scale?: number;
  value?: string;
}

const DraggableField: React.FC<DraggableFieldProps> = ({
  id,
  type,
  label,
  initialX,
  initialY,
  width = 200,
  height = 50,
  onPositionChange,
  onRemove,
  onEdit,
  containerWidth = 800,
  containerHeight = 600,
  scale = 1,
  value = ''
}) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const fieldRef = useRef<HTMLDivElement>(null);

  // Find the PDF container (iframe parent) to constrain dragging
  const findPDFContainer = () => {
    if (!fieldRef.current) return null;
    
    // Look for the PDF viewer container - it should be the parent with relative positioning
    let container = fieldRef.current.parentElement;
    while (container) {
      if (container.classList.contains('relative') && container.querySelector('iframe')) {
        return container;
      }
      container = container.parentElement;
    }
    return fieldRef.current.offsetParent as HTMLElement;
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !fieldRef.current) return;

      const pdfContainer = findPDFContainer();
      if (!pdfContainer) return;

      const containerRect = pdfContainer.getBoundingClientRect();
      
      // Calculate new position based on mouse position minus drag offset
      const newX = ((e.clientX - containerRect.left - dragOffset.x) / scale);
      const newY = ((e.clientY - containerRect.top - dragOffset.y) / scale);
      
      // Calculate the scaled field dimensions
      const scaledWidth = width / scale;
      const scaledHeight = height / scale;
      
      // Get the actual container dimensions (accounting for scale)
      const actualContainerWidth = containerRect.width / scale;
      const actualContainerHeight = containerRect.height / scale;
      
      // Constrain to PDF container bounds with proper scaling
      const constrainedX = Math.max(0, Math.min(actualContainerWidth - scaledWidth, newX));
      const constrainedY = Math.max(0, Math.min(actualContainerHeight - scaledHeight, newY));
      
      // Convert to percentage for storage
      const percentX = (constrainedX / actualContainerWidth) * 100;
      const percentY = (constrainedY / actualContainerHeight) * 100;
      
      setPosition({ x: percentX, y: percentY });
      onPositionChange(id, percentX, percentY);
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isDragging, dragOffset, width, height, scale, onPositionChange, id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!fieldRef.current) return;

    const rect = fieldRef.current.getBoundingClientRect();
    
    // Calculate offset from mouse position to top-left of element (accounting for scale)
    setDragOffset({
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    });
    
    setIsDragging(true);
  };

  // Calculate position in pixels based on the container
  const getPixelPosition = () => {
    const pdfContainer = findPDFContainer();
    if (!pdfContainer) {
      return { x: 0, y: 0 };
    }
    
    const containerRect = pdfContainer.getBoundingClientRect();
    const actualContainerWidth = containerRect.width / scale;
    const actualContainerHeight = containerRect.height / scale;
    
    return {
      x: (position.x / 100) * actualContainerWidth,
      y: (position.y / 100) * actualContainerHeight
    };
  };

  const pixelPosition = getPixelPosition();

  const getFieldContent = () => {
    switch (type) {
      case 'signature':
        if (value && value.startsWith('data:image')) {
          return (
            <img 
              src={value} 
              alt="Signature" 
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          );
        }
        return <span className="text-lg font-script">Signature</span>;
      case 'initials':
        return <span className="text-base font-bold">{value || 'AB'}</span>;
      case 'name':
        return <span className="text-sm font-medium">{value || 'Full Name'}</span>;
      case 'date':
        return <span className="text-sm">{value || new Date().toLocaleDateString()}</span>;
      case 'text':
        return <span className="text-sm">{value || 'Custom Text'}</span>;
      case 'company_stamp':
        if (value && value.startsWith('data:image')) {
          return (
            <img 
              src={value} 
              alt="Company Stamp" 
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          );
        }
        return <span className="text-xs">Company Stamp</span>;
      default:
        return <span className="text-sm">{label}</span>;
    }
  };

  const getFieldColor = () => {
    switch (type) {
      case 'signature':
        return 'border-blue-500 bg-blue-50';
      case 'initials':
        return 'border-green-500 bg-green-50';
      case 'name':
        return 'border-purple-500 bg-purple-50';
      case 'date':
        return 'border-orange-500 bg-orange-50';
      case 'text':
        return 'border-gray-500 bg-gray-50';
      case 'company_stamp':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  return (
    <div
      ref={fieldRef}
      className={`absolute z-20 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `${pixelPosition.x}px`,
        top: `${pixelPosition.y}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${1 / scale})`,
        transformOrigin: 'top left'
      }}
      onMouseDown={handleMouseDown}
    >
      <Card className={`border-2 ${getFieldColor()} shadow-lg h-full ${isDragging ? 'shadow-2xl' : ''}`}>
        <CardContent className="p-2 relative h-full flex items-center justify-center">
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0 z-30"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(id);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
          
          {onEdit && type === 'text' && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute -top-2 -left-2 h-6 w-6 p-0 z-30"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(id);
              }}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}

          <div className="text-center overflow-hidden pointer-events-none">
            {getFieldContent()}
          </div>
          
          <div className="absolute bottom-1 right-1 pointer-events-none">
            <Move className="h-3 w-3 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DraggableField;
