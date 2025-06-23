
import React, { useState, useEffect } from 'react';
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
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    if (documentUrl) {
      // Create a proper URL for viewing PDFs in iframe
      let viewUrl = documentUrl;
      
      // If it's a Supabase storage URL, ensure it's properly formatted
      if (documentUrl.includes('supabase')) {
        viewUrl = `${documentUrl}#view=FitH`;
      } else {
        viewUrl = `${documentUrl}#toolbar=0&view=FitH`;
      }
      
      setPdfUrl(viewUrl);
      console.log('Document URL:', viewUrl);
    }
  }, [documentUrl]);

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
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={onBack} className="border-gray-200 bg-white hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex space-x-2">
          {showSigningInterface && (
            <Button
              variant="outline"
              onClick={() => setShowSignatureCanvas(!showSignatureCanvas)}
              className="border-gray-200 bg-white hover:bg-gray-50"
            >
              <PenTool className="h-4 w-4 mr-2" />
              Add Signature
            </Button>
          )}
          <Button onClick={onDownload} className="bg-blue-500 hover:bg-blue-600">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="bg-white border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-800">{documentName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-white rounded-lg overflow-hidden border border-gray-200 w-full" style={{ minHeight: '800px' }}>
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full min-h-[800px] border-0"
                  title="Document Preview"
                  onError={(e) => {
                    console.error('PDF loading error:', e);
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-96 bg-gray-25">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">Loading document...</p>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                </div>
              )}
              {signatures.map((sig) => (
                <DraggableSignature
                  key={sig.id}
                  signature={sig.signature}
                  initialX={sig.x}
                  initialY={sig.y}
                  onPositionChange={(x, y) => handlePositionChange(sig.id, x, y)}
                  onRemove={() => handleRemoveSignature(sig.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {showSigningInterface && showSignatureCanvas && (
          <Card className="bg-white border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">Create Signature</CardTitle>
            </CardHeader>
            <CardContent>
              <SignatureCanvas onSignatureChange={handleSignatureChange} />
              {currentSignature && (
                <Button className="w-full mt-4 bg-blue-500 hover:bg-blue-600" onClick={handleAddSignature}>
                  Add to Document
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
