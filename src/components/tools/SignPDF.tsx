
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, PenTool, ArrowLeft, Download, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import SignatureCanvas from '../SignatureCanvas';
import DraggableSignature from '../DraggableSignature';
import { useDocuments } from '@/hooks/useDocuments';
import { useSignatures } from '@/hooks/useSignatures';
import { PDFProcessor } from '@/services/pdfProcessor';

interface SignPDFProps {
  onBack: () => void;
}

const SignPDF = ({ onBack }: SignPDFProps) => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'edit' | 'save' | 'output'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);
  const [signatures, setSignatures] = useState<Array<{ id: string; signature: string; x: number; y: number; pageNumber: number }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [documentId, setDocumentId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { uploadDocument } = useDocuments();
  const { saveSignature, loading: signatureLoading } = useSignatures();

  const validateFileSize = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return file.size <= maxSize;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      if (!validateFileSize(selectedFile)) {
        toast({
          title: 'File too large',
          description: 'Please select a PDF file smaller than 10MB',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setCurrentStep('edit');
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
        y: 50,
        pageNumber: 1
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

  const handleProceedToSave = () => {
    if (!signerName || !signerEmail || signatures.length === 0) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all fields and add at least one signature',
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep('save');
  };

  const handleGenerateSignedPDF = async () => {
    if (!file || signatures.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      setProgress(25);
      
      // First upload the original document to get an ID
      const uploadedDoc = await uploadDocument(file);
      if (!uploadedDoc) throw new Error('Failed to upload document');
      
      setDocumentId(uploadedDoc.id);
      setProgress(50);

      // Save all signatures to database
      for (const sig of signatures) {
        await saveSignature(
          uploadedDoc.id,
          sig.signature,
          sig.x,
          sig.y,
          signerName,
          signerEmail,
          sig.pageNumber
        );
      }
      setProgress(75);

      // Generate signed PDF using PDF-lib
      const fileBuffer = await file.arrayBuffer();
      const signaturePositions = signatures.map(sig => ({
        x: sig.x,
        y: sig.y,
        signatureData: sig.signature,
        pageNumber: sig.pageNumber
      }));

      const signedPdfBytes = await PDFProcessor.addSignaturesToPDF(fileBuffer, signaturePositions);
      const signedBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      setProcessedFile(signedBlob);
      setProgress(100);

      setIsProcessing(false);
      setCurrentStep('output');
      
      toast({
        title: 'PDF signed successfully',
        description: 'Your signed PDF is ready for download',
      });
    } catch (error) {
      console.error('Error generating signed PDF:', error);
      setIsProcessing(false);
      toast({
        title: 'Signing failed',
        description: 'Failed to generate signed PDF',
        variant: 'destructive',
      });
    }
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

  const handleSaveToDatabase = async () => {
    if (!processedFile || !file) return;
    
    try {
      const signedFile = new File([processedFile], `signed_${file.name}`, { type: 'application/pdf' });
      await uploadDocument(signedFile);
      
      toast({
        title: 'Saved to documents',
        description: 'Your signed PDF has been saved to your documents',
      });
      
      resetFlow();
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save signed PDF to documents',
        variant: 'destructive',
      });
    }
  };

  const resetFlow = () => {
    setCurrentStep('upload');
    setFile(null);
    setSignatures([]);
    setProcessedFile(null);
    setPreviewUrl(null);
    setSignerName('');
    setSignerEmail('');
    setProgress(0);
    setDocumentId(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white min-h-screen">
      <div className="mb-6">
        <Button variant="outline" onClick={onBack} className="mb-4 border-gray-300 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tools
        </Button>
      </div>

      <div className="space-y-6">
        {/* Step Indicator */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              {['upload', 'edit', 'save', 'output'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step ? 'bg-blue-500 text-white' : 
                    ['upload', 'edit', 'save', 'output'].indexOf(currentStep) > index ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  {index < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      ['upload', 'edit', 'save', 'output'].indexOf(currentStep) > index ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Upload</span>
              <span>Edit</span>
              <span>Save</span>
              <span>Output</span>
            </div>
          </CardContent>
        </Card>

        {/* Upload Step */}
        {currentStep === 'upload' && (
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PenTool className="h-6 w-6 text-blue-500" />
                <span>Step 1: Upload PDF Document</span>
              </CardTitle>
              <CardDescription>
                Select a PDF file to add signatures (Max 10MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
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
                  <Button asChild className="cursor-pointer bg-blue-500 hover:bg-blue-600">
                    <span>Choose PDF File</span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Step */}
        {currentStep === 'edit' && (
          <>
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle>Step 2: Signer Information</CardTitle>
                <CardDescription>
                  Enter the details of the person signing this document
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {file && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-medium text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Full Name"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                  />
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle>Create Signature</CardTitle>
                  <CardDescription>
                    Draw your signature and position it on the document
                  </CardDescription>
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

              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle>Document Preview</CardTitle>
                  <CardDescription>
                    Position your signatures by dragging them
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden" style={{ height: '400px' }}>
                    {previewUrl && (
                      <iframe
                        src={previewUrl}
                        className="w-full h-full"
                        title="PDF Preview"
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
                        containerWidth={400}
                        containerHeight={400}
                      />
                    ))}
                  </div>
                  <Button
                    onClick={handleProceedToSave}
                    className="w-full mt-4 bg-green-500 hover:bg-green-600"
                    disabled={!signerName || !signerEmail || signatures.length === 0}
                  >
                    Proceed to Save
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Save Step */}
        {currentStep === 'save' && (
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle>Step 3: Generate Signed PDF</CardTitle>
              <CardDescription>
                Review and generate your signed document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium text-gray-800 mb-2">Document Summary</h3>
                <p className="text-sm text-gray-600">File: {file?.name}</p>
                <p className="text-sm text-gray-600">Signer: {signerName} ({signerEmail})</p>
                <p className="text-sm text-gray-600">Signatures: {signatures.length}</p>
              </div>

              {isProcessing && (
                <div className="space-y-4">
                  <Progress value={progress} className="w-full h-3" />
                  <p className="text-center text-sm text-gray-600">
                    Generating signed PDF... {progress}%
                  </p>
                </div>
              )}

              {!isProcessing && (
                <Button
                  onClick={handleGenerateSignedPDF}
                  className="w-full bg-green-500 hover:bg-green-600"
                  disabled={signatureLoading}
                >
                  Generate Signed PDF
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Output Step */}
        {currentStep === 'output' && (
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span>PDF Signed Successfully!</span>
              </CardTitle>
              <CardDescription className="text-center">
                Your PDF has been signed and is ready for download
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-8 bg-green-50 rounded-lg border border-green-200 text-center">
                <div className="text-green-500 mb-4">
                  <PenTool className="h-16 w-16 mx-auto" />
                </div>
                <p className="font-medium text-green-800 text-lg mb-2">
                  {file?.name}
                </p>
                <p className="text-sm text-green-600">
                  Successfully signed with {signatures.length} signature{signatures.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleDownload}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Signed PDF
                </Button>
                <Button
                  onClick={handleSaveToDatabase}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  Save to Documents
                </Button>
                <Button
                  onClick={resetFlow}
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-50"
                >
                  Sign Another Document
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SignPDF;
