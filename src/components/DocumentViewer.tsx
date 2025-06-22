
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, PenTool } from 'lucide-react';
import SignatureCanvas from './SignatureCanvas';
import DraggableSignature from './DraggableSignature';

interface DocumentViewerProps {
  documentUrl: string;
  documentName: string;
  onBack: () => void;
  onDownload: () => void;
  showSigningInterface?: boolean;
  onSignatureAdd?: (signature: string, x: number, y: number) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentUrl,
  documentName,
  onBack,
  onDownload,
  showSigningInterface = false,
  onSignatureAdd
}) => {
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);
  const [signatures, setSignatures] = useState<Array<{ id: string; signature: string; x: number; y: number }>>([]);
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);

  const handleSignatureChange = (signature: string | null) => {
    setCurrentSignature(signature);
  };

  const handleAddSignature = () => {
    if (currentSignature) {
      const newSignature = {
        id: Date.now().toString(),
        signature: currentSignature,
        x: 50,
        y: 50
      };
      setSignatures([...signatures, newSignature]);
      setShowSignatureCanvas(false);
      setCurrentSignature(null);
    }
  };

  const handlePositionChange = (id: string, x: number, y: number) => {
    setSignatures(signatures.map(sig => 
      sig.id === id ? { ...sig, x, y } : sig
    ));
    
    const signature = signatures.find(sig => sig.id === id);
    if (signature && onSignatureAdd) {
      onSignatureAdd(signature.signature, x, y);
    }
  };

  const handleRemoveSignature = (id: string) => {
    setSignatures(signatures.filter(sig => sig.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex space-x-2">
          {showSigningInterface && (
            <Button
              variant="outline"
              onClick={() => setShowSignatureCanvas(!showSignatureCanvas)}
            >
              <PenTool className="h-4 w-4 mr-2" />
              Add Signature
            </Button>
          )}
          <Button onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{documentName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '600px' }}>
                <iframe
                  src={documentUrl}
                  className="w-full h-full min-h-[600px]"
                  title="Document Preview"
                />
                {signatures.map((sig) => (
                  <DraggableSignature
                    key={sig.id}
                    signature={sig.signature}
                    onPositionChange={(x, y) => handlePositionChange(sig.id, x, y)}
                    onRemove={() => handleRemoveSignature(sig.id)}
                    containerWidth={800}
                    containerHeight={600}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {showSigningInterface && showSignatureCanvas && (
          <div className="lg:col-span-1">
            <SignatureCanvas onSignatureChange={handleSignatureChange} />
            {currentSignature && (
              <Button className="w-full mt-4" onClick={handleAddSignature}>
                Add to Document
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
