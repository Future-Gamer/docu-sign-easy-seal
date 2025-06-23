
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, PenTool, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (documentUrl) {
      setIsLoading(true);
      setLoadError(null);
      
      // Create a proper URL for viewing PDFs in iframe
      let viewUrl = documentUrl;
      
      // If it's a Supabase storage URL, ensure it's properly formatted
      if (documentUrl.includes('supabase')) {
        viewUrl = `${documentUrl}#view=FitH&toolbar=0`;
      } else {
        viewUrl = `${documentUrl}#toolbar=0&view=FitH`;
      }
      
      setPdfUrl(viewUrl);
      console.log('Document URL:', viewUrl);
      
      // Test if the URL is accessible
      fetch(documentUrl, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load document: ${response.status} ${response.statusText}`);
          }
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Document loading error:', error);
          setLoadError(error.message);
          setIsLoading(false);
          toast({
            title: 'Document loading failed',
            description: 'Unable to load the document. Please try again.',
            variant: 'destructive',
          });
        });
    }
  }, [documentUrl, toast]);

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

  const handleRetryLoad = () => {
    setIsLoading(true);
    setLoadError(null);
    window.location.reload();
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
              {isLoading && (
                <div className="flex items-center justify-center h-96 bg-gray-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-gray-500">Loading document...</p>
                  </div>
                </div>
              )}
              
              {loadError && (
                <div className="flex items-center justify-center h-96 bg-gray-50">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-700 mb-2">Failed to load document</p>
                    <p className="text-sm text-gray-500 mb-4">{loadError}</p>
                    <Button onClick={handleRetryLoad} variant="outline" className="border-gray-300 hover:bg-gray-50">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              )}
              
              {!isLoading && !loadError && pdfUrl && (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full min-h-[800px] border-0"
                  title="Document Preview"
                  onLoad={() => {
                    console.log('PDF loaded successfully');
                    setIsLoading(false);
                  }}
                  onError={(e) => {
                    console.error('PDF iframe error:', e);
                    setLoadError('Failed to display PDF in viewer');
                    setIsLoading(false);
                  }}
                />
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
