
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Move } from 'lucide-react';

interface DraggableSignatureProps {
  signature: string;
  initialX?: number;
  initialY?: number;
  onPositionChange: (x: number, y: number) => void;
  onRemove: () => void;
  containerWidth?: number;
  containerHeight?: number;
  scale?: number;
}

const DraggableSignature: React.FC<DraggableSignatureProps> = ({
  signature,
  initialX = 10,
  initialY = 10,
  onPositionChange,
  onRemove,
  containerWidth = 800,
  containerHeight = 600,
  scale = 1
}) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const signatureRef = useRef<HTMLDivElement>(null);

  const signatureWidth = 200;
  const signatureHeight = 80;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const rect = signatureRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !signatureRef.current) return;

    const container = signatureRef.current.offsetParent as HTMLElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    
    // Calculate new position as percentage of container
    const newX = ((e.clientX - containerRect.left - dragStart.x) / containerRect.width) * 100;
    const newY = ((e.clientY - containerRect.top - dragStart.y) / containerRect.height) * 100;
    
    // Constrain to container bounds
    const constrainedX = Math.max(0, Math.min(100 - (signatureWidth / containerRect.width * 100), newX));
    const constrainedY = Math.max(0, Math.min(100 - (signatureHeight / containerRect.height * 100), newY));
    
    setPosition({ x: constrainedX, y: constrainedY });
    onPositionChange(constrainedX, constrainedY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Convert percentage position to pixels
  const pixelX = (position.x / 100) * containerWidth;
  const pixelY = (position.y / 100) * containerHeight;

  return (
    <div
      ref={signatureRef}
      className="absolute cursor-move z-20"
      style={{
        left: `${pixelX}px`,
        top: `${pixelY}px`,
        width: `${signatureWidth}px`,
        height: `${signatureHeight}px`,
        transform: `scale(${1 / scale})`,
        transformOrigin: 'top left'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Card className="border-2 border-blue-500 bg-white shadow-lg">
        <CardContent className="p-2 relative">
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0 z-30"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
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
