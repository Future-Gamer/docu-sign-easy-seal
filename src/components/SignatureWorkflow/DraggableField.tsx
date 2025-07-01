
import React, { useState, useRef, useEffect, useCallback } from 'react';
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

  const findPDFContainer = useCallback(() => {
    if (!fieldRef.current) return null;
    
    // Find the PDF viewer container by looking for the iframe's parent
    let container = fieldRef.current.parentElement;
    while (container) {
      if (container.classList.contains('relative') && container.querySelector('iframe')) {
        return container;
      }
      container = container.parentElement;
    }
    return fieldRef.current.parentElement;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !fieldRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const pdfContainer = findPDFContainer();
    if (!pdfContainer) return;

    const containerRect = pdfContainer.getBoundingClientRect();
    
    // Calculate new position relative to container
    const newX = (e.clientX - containerRect.left - dragOffset.x);
    const newY = (e.clientY - containerRect.top - dragOffset.y);
    
    // Apply scale factor for positioning
    const scaledX = newX;
    const scaledY = newY;
    
    // Get scaled dimensions
    const scaledWidth = width;
    const scaledHeight = height;
    const scaledContainerWidth = containerRect.width;
    const scaledContainerHeight = containerRect.height;
    
    // Constrain to container bounds
    const constrainedX = Math.max(0, Math.min(scaledContainerWidth - scaledWidth, scaledX));
    const constrainedY = Math.max(0, Math.min(scaledContainerHeight - scaledHeight, scaledY));
    
    // Convert to percentage for consistent positioning
    const percentX = (constrainedX / scaledContainerWidth) * 100;
    const percentY = (constrainedY / scaledContainerHeight) * 100;
    
    setPosition({ x: percentX, y: percentY });
    onPositionChange(id, percentX, percentY);
  }, [isDragging, dragOffset, width, height, onPositionChange, id, findPDFContainer]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
    document.body.style.pointerEvents = 'auto';
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      document.body.style.pointerEvents = 'auto';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!fieldRef.current) return;

    const pdfContainer = findPDFContainer();
    if (!pdfContainer) return;

    const fieldRect = fieldRef.current.getBoundingClientRect();
    
    // Calculate offset from mouse to field's top-left corner
    setDragOffset({
      x: e.clientX - fieldRect.left,
      y: e.clientY - fieldRect.top
    });
    
    setIsDragging(true);
    console.log('Starting drag for field:', id, 'at position:', e.clientX, e.clientY);
  };

  // Calculate pixel position from percentage
  const getPixelPosition = () => {
    const pdfContainer = findPDFContainer();
    if (!pdfContainer) {
      return { x: 0, y: 0 };
    }
    
    const containerRect = pdfContainer.getBoundingClientRect();
    
    return {
      x: (position.x / 100) * containerRect.width,
      y: (position.y / 100) * containerRect.height
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
      className={`absolute z-30 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `${pixelPosition.x}px`,
        top: `${pixelPosition.y}px`,
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: 'auto'
      }}
      onMouseDown={handleMouseDown}
    >
      <Card className={`border-2 ${getFieldColor()} shadow-lg h-full ${isDragging ? 'shadow-2xl opacity-90' : ''}`}>
        <CardContent className="p-2 relative h-full flex items-center justify-center">
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0 z-40"
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
              className="absolute -top-2 -left-2 h-6 w-6 p-0 z-40"
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
