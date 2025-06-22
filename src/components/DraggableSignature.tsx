
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Move } from 'lucide-react';

interface DraggableSignatureProps {
  signature: string;
  onPositionChange: (x: number, y: number) => void;
  onRemove: () => void;
  containerWidth: number;
  containerHeight: number;
}

const DraggableSignature: React.FC<DraggableSignatureProps> = ({
  signature,
  onPositionChange,
  onRemove,
  containerWidth,
  containerHeight
}) => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const signatureRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const newX = Math.max(0, Math.min(containerWidth - 200, e.clientX - dragStart.x));
    const newY = Math.max(0, Math.min(containerHeight - 100, e.clientY - dragStart.y));
    
    setPosition({ x: newX, y: newY });
    onPositionChange(newX, newY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={signatureRef}
      className="absolute cursor-move z-10"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '200px',
        height: '100px'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Card className="border-2 border-blue-500 bg-white/90 backdrop-blur-sm">
        <CardContent className="p-2 relative">
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
          <div className="flex items-center justify-center h-16">
            <img
              src={signature}
              alt="Signature"
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          </div>
          <div className="absolute bottom-1 right-1">
            <Move className="h-3 w-3 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DraggableSignature;
