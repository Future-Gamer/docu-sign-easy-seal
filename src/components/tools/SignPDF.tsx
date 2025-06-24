
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, PenTool, ArrowLeft, Download, CheckCircle, FileText, Send } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import SignatureCanvas from '../SignatureCanvas';
import PDFViewer from '../PDFViewer';
import { PDFProcessor } from '@/services/pdfProcessor';

interface SignPDFProps {
  onBack: () => void;
}

type WorkflowStep = 'upload' | 'sign' | 'review' | 'complete';

const SignPDF = ({ onBack }: SignPDFProps) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
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
  const { toast } = useToast();

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

    if (file.size > 25 * 1024 * 1024) { // 25MB limit
      toast({
        title: 'File too large',
        description: 'Please select a PDF file smaller than 25MB',
        variant: 'destructive',
      });
      return;
    }

    const isValidPDF = await PDFProcessor.validatePDF(file);
    if (!isValidPDF) {
      toast({
        title: 'Invalid PDF',
        description: 'The selected file appears to be corrupted',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setCurrentStep('sign');
    toast({
      title: 'PDF uploaded successfully',
      description: 'You can now add your signature',
    });
  };

  // Step 2: Add Signature
  const handleAddSignature = () => {
    if (!currentSignature) {
      toast({
        title: 'No signature',
        description: 'Please create a signature first',
        variant: 'destructive',
      });
      return;
    }

    const newSignature = {
      id: `sig_${Date.now()}`,
      signature: currentSignature,
      x: 20, // 20% from left
      y: 20, // 20% from top
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
        description: 'Please add at least one signature before proceeding',
        variant: 'destructive',
      });
      return;
    }

    if (!signerInfo.name.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    setCurrentStep('review');
  };

  // Step 3: Generate Signed PDF
  const handleGenerateSignedPDF = async () => {
    if (!selectedFile || signatures.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Progress updates
      const progressTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + 15;
        });
      }, 300);

      // Process the PDF
      const fileBuffer = await selectedFile.arrayBuffer();
      const signaturePositions = signatures.map(sig => ({
        x: sig.x,
        y: sig.y,
        signatureData: sig.signature,
        pageNumber: sig.pageNumber,
        width: 200,
        height: 80
      }));

      console.log('Processing signatures:', signaturePositions);
      
      const signedPdfBytes = await PDFProcessor.addSignaturesToPDF(fileBuffer, signaturePositions);
      const signedBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      
      setSignedPdfBlob(signedBlob);
      clearInterval(progressTimer);
      setProgress(100);
      
      setTimeout(() => {
        setIsProcessing(false);
        setCurrentStep('complete');
        toast({
          title: 'PDF signed successfully!',
          description: 'Your document is ready for download',
        });
      }, 500);

    } catch (error) {
      console.error('Error generating signed PDF:', error);
      setIsProcessing(false);
      toast({
        title: 'Signing failed',
        description: 'Failed to generate signed PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadSigned = () => {
    if (!signedPdfBlob || !selectedFile) return;
    
    const url = URL.createObjectURL(signedPdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `signed_${selectedFile.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download started',
      description: 'Your signed PDF is being downloaded',
    });
  };

  const resetWorkflow = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setSignerInfo({ name: '', email: '' });
    setSignatures([]);
    setCurrentSignature(null);
    setSignedPdfBlob(null);
    setProgress(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tools
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900">Sign PDF Document</h1>
        <p className="text-gray-600 mt-2">Upload, sign, and download your PDF documents</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {['upload', 'sign', 'review', 'complete'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                ['upload', 'sign', 'review', 'complete'].indexOf(currentStep) >= index 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              {index < 3 && (
                <div className={`w-16 h-1 mx-2 ${
                  ['upload', 'sign', 'review', 'complete'].indexOf(currentStep) > index 
                    ? 'bg-blue-500' 
                    : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center space-x-20 mt-2 text-sm text-gray-600">
          <span>Upload</span>
          <span>Sign</span>
          <span>Review</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 'upload' && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-6 w-6 text-blue-500" />
              <span>Upload PDF Document</span>
            </CardTitle>
            <CardDescription>
              Choose a PDF file to add your digital signature
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Select PDF to Sign
              </h3>
              <p className="text-gray-500 mb-6">
                Choose a PDF file from your computer (max 25MB)
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
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose PDF File
                  </span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'sign' && selectedFile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Signature Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PenTool className="h-5 w-5 text-blue-500" />
                  <span>Create Signature</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SignatureCanvas onSignatureChange={setCurrentSignature} />
                {currentSignature && (
                  <Button
                    onClick={handleAddSignature}
                    className="w-full mt-4 bg-blue-500 hover:bg-blue-600"
                  >
                    Place on Document
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Signer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <Input
                    placeholder="Enter your full name"
                    value={signerInfo.name}
                    onChange={(e) => setSignerInfo(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (optional)
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={signerInfo.email}
                    onChange={(e) => setSignerInfo(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Signatures ({signatures.length})</CardTitle>
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
                  Continue to Review
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* PDF Viewer */}
          <div className="lg:col-span-2">
            <PDFViewer
              file={selectedFile}
              signatures={signatures}
              onSignaturePositionChange={handleSignaturePositionChange}
              onSignatureRemove={handleRemoveSignature}
            />
          </div>
        </div>
      )}

      {currentStep === 'review' && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Review & Sign Document</CardTitle>
            <CardDescription>
              Review your document and generate the final signed PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Document</h4>
                <p className="text-sm text-gray-600">Name: {selectedFile?.name}</p>
                <p className="text-sm text-gray-600">
                  Size: {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0} MB
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Signature Details</h4>
                <p className="text-sm text-gray-600">Signer: {signerInfo.name}</p>
                <p className="text-sm text-gray-600">Signatures: {signatures.length}</p>
                <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {isProcessing && (
              <div className="space-y-4">
                <Progress value={progress} className="w-full h-3" />
                <p className="text-center text-sm text-gray-600">
                  Processing document... {progress}%
                </p>
              </div>
            )}

            {!isProcessing && (
              <div className="text-center">
                <Button
                  onClick={handleGenerateSignedPDF}
                  className="bg-green-500 hover:bg-green-600 px-8 py-3"
                  size="lg"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Generate Signed PDF
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === 'complete' && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <span className="text-green-800">Document Signed Successfully!</span>
            </CardTitle>
            <CardDescription className="text-center">
              Your PDF has been digitally signed and is ready for download
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-8 bg-green-50 rounded-lg text-center">
              <FileText className="h-20 w-20 text-green-500 mx-auto mb-4" />
              <h3 className="font-medium text-green-800 text-xl mb-2">
                {selectedFile?.name}
              </h3>
              <p className="text-sm text-green-600 mb-4">
                Signed by {signerInfo.name} on {new Date().toLocaleDateString()}
              </p>
              <p className="text-sm text-green-600">
                Contains {signatures.length} digital signature{signatures.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleDownloadSigned}
                className="w-full bg-blue-500 hover:bg-blue-600"
                size="lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Signed PDF
              </Button>

              <Button
                onClick={resetWorkflow}
                variant="outline"
                className="w-full"
              >
                Sign Another Document
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SignPDF;
