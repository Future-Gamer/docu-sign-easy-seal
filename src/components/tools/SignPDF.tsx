
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, PenTool, ArrowLeft, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SignatureCanvas from '../SignatureCanvas';
import DraggableSignature from '../DraggableSignature';
import { useDocuments } from '@/hooks/useDocuments';

interface SignPDFProps {
  onBack: () => void;
}

const SignPDF = ({ onBack }: SignPDFProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);
  const [signatures, setSignatures] = useState<Array<{ id: string; signature: string; x: number; y: number }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { uploadDocument } = useDocuments();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please select a PDF file',
        variant: 'destructive',
      });
    }
  };

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
      setCurrentSignature(null);
    }
  };

  const handlePositionChange = (id: string, x: number, y: number) => {
    setSignatures(signatures.map(sig => 
      sig.id === id ? { ...sig, x, y } : sig
    ));
  };

  const handleRemoveSignature = (id: string) => {
    setSignatures(signatures.filter(sig => sig.id !== id));
  };

  const handleSign = async () => {
    if (!file || !signerName || !signerEmail || signatures.length === 0) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all fields, select a PDF file, and add at least one signature',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate signing process
    setTimeout(async () => {
      try {
        // Create a signed PDF blob (in real implementation, use PDF-lib)
        const signedBlob = new Blob([file], { type: 'application/pdf' });
        setProcessedFile(signedBlob);
        
        // Upload to database
        const signedFile = new File([signedBlob], `signed_${file.name}`, { type: 'application/pdf' });
        await uploadDocument(signedFile);
        
        setIsProcessing(false);
        toast({
          title: 'PDF signed successfully',
          description: 'Your signed PDF is ready for download',
        });
      } catch (error) {
        setIsProcessing(false);
        toast({
          title: 'Signing failed',
          description: 'Failed to sign PDF file',
          variant: 'destructive',
        });
      }
    }, 3000);
  };

  const handleDownload = () => {
    if (!processedFile || !file) return;
    
    const url = URL.createObjectURL(processedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signed_${file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tools
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PenTool className="h-6 w-6 text-blue-500" />
                <span>Sign PDF</span>
              </CardTitle>
              <CardDescription>
                Upload a PDF and add your signature
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-100 mb-2">
                  Select a PDF file to sign
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload">
                  <Button asChild className="cursor-pointer">
                    <span>Choose File</span>
                  </Button>
                </label>
              </div>

              {file && (
                <div className="space-y-6">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded">
                        <PenTool className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{file.name}</p>
                        <p className="text-sm text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Signer Name
                      </label>
                      <Input
                        placeholder="Enter signer name"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Signer Email
                      </label>
                      <Input
                        type="email"
                        placeholder="Enter signer email"
                        value={signerEmail}
                        onChange={(e) => setSignerEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {!processedFile ? (
                    <Button
                      onClick={handleSign}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? 'Processing...' : 'Sign PDF'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleDownload}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Signed PDF
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <SignatureCanvas onSignatureChange={handleSignatureChange} />
          {currentSignature && (
            <Button className="w-full mt-4" onClick={handleAddSignature}>
              Add to Document
            </Button>
          )}
        </div>

        {previewUrl && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Document Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-96 bg-gray-100 rounded border overflow-hidden">
                  <iframe
                    src={previewUrl}
                    className="w-full h-full"
                    title="PDF Preview"
                  />
                  {signatures.map((sig) => (
                    <DraggableSignature
                      key={sig.id}
                      signature={sig.signature}
                      onPositionChange={(x, y) => handlePositionChange(sig.id, x, y)}
                      onRemove={() => handleRemoveSignature(sig.id)}
                      containerWidth={300}
                      containerHeight={384}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignPDF;
