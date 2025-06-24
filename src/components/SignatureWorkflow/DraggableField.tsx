
import React, { useState, useRef } from 'react';
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
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fieldRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const rect = fieldRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !fieldRef.current) return;

    const container = fieldRef.current.offsetParent as HTMLElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    
    const newX = ((e.clientX - containerRect.left - dragStart.x) / containerRect.width) * 100;
    const newY = ((e.clientY - containerRect.top - dragStart.y) / containerRect.height) * 100;
    
    const constrainedX = Math.max(0, Math.min(100 - (width / containerRect.width * 100), newX));
    const constrainedY = Math.max(0, Math.min(100 - (height / containerRect.height * 100), newY));
    
    setPosition({ x: constrainedX, y: constrainedY });
    onPositionChange(id, constrainedX, constrainedY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const pixelX = (position.x / 100) * containerWidth;
  const pixelY = (position.y / 100) * containerHeight;

  const getFieldContent = () => {
    switch (type) {
      case 'signature':
        return value || 'Signature';
      case 'initials':
        return value || 'AB';
      case 'name':
        return value || 'Name';
      case 'date':
        return value || new Date().toLocaleDateString();
      case 'text':
        return value || 'Text';
      case 'company_stamp':
        return value || 'Company Stamp';
      default:
        return label;
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
      className="absolute cursor-move z-20"
      style={{
        left: `${pixelX}px`,
        top: `${pixelY}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${1 / scale})`,
        transformOrigin: 'top left'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Card className={`border-2 ${getFieldColor()} shadow-lg h-full`}>
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
          
          {onEdit && (
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

          <div className="text-center text-sm font-medium text-gray-700">
            {getFieldContent()}
          </div>
          
          <div className="absolute bottom-1 right-1">
            <Move className="h-3 w-3 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DraggableField;
