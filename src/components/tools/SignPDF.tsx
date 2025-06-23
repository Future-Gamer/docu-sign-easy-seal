
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, PenTool, ArrowLeft, Download, CheckCircle, FileText, Mail } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import SignatureCanvas from '../SignatureCanvas';
import PDFViewer from '../PDFViewer';
import { useDocuments } from '@/hooks/useDocuments';
import { useSignatures } from '@/hooks/useSignatures';
import { PDFProcessor } from '@/services/pdfProcessor';

interface SignPDFProps {
  onBack: () => void;
}

const SignPDF = ({ onBack }: SignPDFProps) => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'prepare' | 'sign' | 'review' | 'complete'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [signerInfo, setSignerInfo] = useState({ name: '', email: '' });
  const [signatures, setSignatures] = useState<Array<{ 
    id: string; 
    signature: string; 
    x: number; 
    y: number; 
    pageNumber: number;
  }>>([]);
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [signedPdfBlob, setSignedPdfBlob] = useState<Blob | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { uploadDocument } = useDocuments();
  const { saveSignature, loading: signatureLoading } = useSignatures();

  // Step 1: File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please select a PDF file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select a PDF file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate PDF
    const isValidPDF = await PDFProcessor.validatePDF(file);
    if (!isValidPDF) {
      toast({
        title: 'Invalid PDF',
        description: 'The selected file appears to be corrupted or invalid',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setCurrentStep('prepare');
  };

  // Step 2: Prepare Document & Signer Info
  const handlePrepareComplete = () => {
    if (!signerInfo.name || !signerInfo.email) {
      toast({
        title: 'Missing information',
        description: 'Please enter signer name and email',
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep('sign');
  };

  // Step 3: Add Signatures
  const handleAddSignature = () => {
    if (!currentSignature) return;

    const newSignature = {
      id: Date.now().toString(),
      signature: currentSignature,
      x: 10, // Start at 10% from left
      y: 10, // Start at 10% from top
      pageNumber: 1
    };

    setSignatures([...signatures, newSignature]);
    setCurrentSignature(null);
    
    toast({
      title: 'Signature added',
      description: 'Drag the signature to position it on the document',
    });
  };

  const handleSignaturePositionChange = (id: string, x: number, y: number) => {
    setSignatures(prev => prev.map(sig => 
      sig.id === id ? { ...sig, x, y } : sig
    ));
  };

  const handleRemoveSignature = (id: string) => {
    setSignatures(prev => prev.filter(sig => sig.id !== id));
  };

  const handleProceedToReview = () => {
    if (signatures.length === 0) {
      toast({
        title: 'No signatures',
        description: 'Please add at least one signature to continue',
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep('review');
  };

  // Step 4: Generate Final PDF
  const handleGenerateSignedPDF = async () => {
    if (!selectedFile || signatures.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload original document
      const uploadedDoc = await uploadDocument(selectedFile);
      if (!uploadedDoc) throw new Error('Failed to upload document');
      setDocumentId(uploadedDoc.id);

      // Save signatures to database
      for (const sig of signatures) {
        await saveSignature(
          uploadedDoc.id,
          sig.signature,
          sig.x,
          sig.y,
          signerInfo.name,
          signerInfo.email,
          sig.pageNumber
        );
      }

      // Generate signed PDF
      const fileBuffer = await selectedFile.arrayBuffer();
      const signaturePositions = signatures.map(sig => ({
        x: sig.x,
        y: sig.y,
        signatureData: sig.signature,
        pageNumber: sig.pageNumber
      }));

      const signedPdfBytes = await PDFProcessor.addSignaturesToPDF(fileBuffer, signaturePositions);
      const signedBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      setSignedPdfBlob(signedBlob);

      clearInterval(progressInterval);
      setProgress(100);
      setIsProcessing(false);
      setCurrentStep('complete');

      toast({
        title: 'Document signed successfully',
        description: 'Your signed PDF is ready for download',
      });

    } catch (error) {
      console.error('Error generating signed PDF:', error);
      setIsProcessing(false);
      toast({
        title: 'Signing failed',
        description: error instanceof Error ? error.message : 'Failed to generate signed PDF',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadSigned = () => {
    if (!signedPdfBlob || !selectedFile) return;
    
    const url = URL.createObjectURL(signedPdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signed_${selectedFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveToDocuments = async () => {
    if (!signedPdfBlob || !selectedFile) return;
    
    try {
      const signedFile = new File([signedPdfBlob], `signed_${selectedFile.name}`, { 
        type: 'application/pdf' 
      });
      await uploadDocument(signedFile);
      
      toast({
        title: 'Saved successfully',
        description: 'Your signed PDF has been saved to your documents',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save signed PDF to documents',
        variant: 'destructive',
      });
    }
  };

  const resetWorkflow = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setSignerInfo({ name: '', email: '' });
    setSignatures([]);
    setCurrentSignature(null);
    setSignedPdfBlob(null);
    setProgress(0);
    setDocumentId(null);
  };

  const steps = ['upload', 'prepare', 'sign', 'review', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Button variant="outline" onClick={onBack} className="mb-4 border-gray-300 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tools
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sign PDF Document</h1>
            <p className="text-gray-600 mt-2">Adobe-style PDF signing workflow</p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <Card className="mb-8 bg-white border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStepIndex ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-20 h-1 mx-2 ${
                    index < currentStepIndex ? 'bg-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Upload</span>
            <span>Prepare</span>
            <span>Sign</span>
            <span>Review</span>
            <span>Complete</span>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 'upload' && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-6 w-6 text-blue-500" />
              <span>Upload PDF Document</span>
            </CardTitle>
            <CardDescription>
              Select a PDF file to add your signature (Maximum 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Choose PDF to Sign
              </h3>
              <p className="text-gray-500 mb-6">
                Drag and drop a PDF file here, or click to browse
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload">
                <Button asChild className="cursor-pointer bg-blue-500 hover:bg-blue-600">
                  <span>Select PDF File</span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'prepare' && selectedFile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
              <CardDescription>
                Review the document and enter signer details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-gray-800 mb-1">Selected Document</h4>
                <p className="text-sm text-gray-600">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signer Name
                  </label>
                  <Input
                    placeholder="Enter full name"
                    value={signerInfo.name}
                    onChange={(e) => setSignerInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signer Email
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={signerInfo.email}
                    onChange={(e) => setSignerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-white border-gray-300"
                  />
                </div>
              </div>

              <Button
                onClick={handlePrepareComplete}
                className="w-full bg-blue-500 hover:bg-blue-600"
                disabled={!signerInfo.name || !signerInfo.email}
              >
                Continue to Signing
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg p-4 text-center" style={{ height: '400px' }}>
                <iframe
                  src={URL.createObjectURL(selectedFile)}
                  className="w-full h-full rounded border"
                  title="PDF Preview"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 'sign' && selectedFile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PenTool className="h-5 w-5 text-blue-500" />
                  <span>Create Signature</span>
                </CardTitle>
                <CardDescription>
                  Draw your signature below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SignatureCanvas onSignatureChange={setCurrentSignature} />
                {currentSignature && (
                  <Button
                    onClick={handleAddSignature}
                    className="w-full mt-4 bg-blue-500 hover:bg-blue-600"
                  >
                    Add Signature to Document
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Signatures Added ({signatures.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {signatures.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No signatures added yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {signatures.map((sig, index) => (
                      <div key={sig.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">Signature {index + 1}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveSignature(sig.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  onClick={handleProceedToReview}
                  className="w-full mt-4 bg-green-500 hover:bg-green-600"
                  disabled={signatures.length === 0}
                >
                  Proceed to Review
                </Button>
              </CardContent>
            </Card>
          </div>

          <PDFViewer
            file={selectedFile}
            signatures={signatures}
            onSignaturePositionChange={handleSignaturePositionChange}
            onSignatureRemove={handleRemoveSignature}
          />
        </div>
      )}

      {currentStep === 'review' && selectedFile && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle>Review & Generate Signed PDF</CardTitle>
            <CardDescription>
              Review your document and generate the final signed PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-gray-800 mb-2">Document Details</h4>
                <p className="text-sm text-gray-600">File: {selectedFile.name}</p>
                <p className="text-sm text-gray-600">Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-gray-800 mb-2">Signer Information</h4>
                <p className="text-sm text-gray-600">Name: {signerInfo.name}</p>
                <p className="text-sm text-gray-600">Email: {signerInfo.email}</p>
                <p className="text-sm text-gray-600">Signatures: {signatures.length}</p>
              </div>
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

      {currentStep === 'complete' && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <span className="text-green-800">Document Signed Successfully!</span>
            </CardTitle>
            <CardDescription className="text-center">
              Your PDF has been signed and is ready for download or saving
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-8 bg-green-50 rounded-lg border border-green-200 text-center">
              <div className="text-green-500 mb-4">
                <FileText className="h-20 w-20 mx-auto" />
              </div>
              <h3 className="font-medium text-green-800 text-xl mb-2">
                {selectedFile?.name}
              </h3>
              <p className="text-sm text-green-600">
                Successfully signed with {signatures.length} signature{signatures.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleDownloadSigned}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Signed PDF
              </Button>
              <Button
                onClick={handleSaveToDocuments}
                className="bg-green-500 hover:bg-green-600"
              >
                Save to Documents
              </Button>
            </div>

            <Button
              onClick={resetWorkflow}
              variant="outline"
              className="w-full border-gray-300 hover:bg-gray-50"
            >
              Sign Another Document
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SignPDF;
