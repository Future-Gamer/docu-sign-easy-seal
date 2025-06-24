
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, FileText, Download, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PDFProcessor } from '@/services/pdfProcessor';
import PDFUploadStep from '../SignatureWorkflow/PDFUploadStep';
import SigningModeStep from '../SignatureWorkflow/SigningModeStep';
import SignatureEditorStep from '../SignatureWorkflow/SignatureEditorStep';
import CompletionStep from '../SignatureWorkflow/CompletionStep';

interface SignPDFProps {
  onBack: () => void;
}

type WorkflowStep = 'upload' | 'mode-selection' | 'editor' | 'complete';

const SignPDF = ({ onBack }: SignPDFProps) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [signingMode, setSigningMode] = useState<'self' | 'multiple'>('self');
  const [signedPdfBlob, setSignedPdfBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please select a PDF file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
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
    setCurrentStep('mode-selection');
  };

  const handleModeSelection = (mode: 'self' | 'multiple') => {
    setSigningMode(mode);
    setCurrentStep('editor');
  };

  const handleSigningComplete = (signedBlob: Blob) => {
    setSignedPdfBlob(signedBlob);
    setCurrentStep('complete');
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
    setSigningMode('self');
    setSignedPdfBlob(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">Sign PDF</h1>
          {selectedFile && (
            <span className="text-sm text-gray-600">• {selectedFile.name}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {currentStep === 'upload' && (
          <PDFUploadStep onFileUpload={handleFileUpload} />
        )}

        {currentStep === 'mode-selection' && selectedFile && (
          <SigningModeStep
            documentName={selectedFile.name}
            onSelectMode={handleModeSelection}
          />
        )}

        {currentStep === 'editor' && selectedFile && (
          <SignatureEditorStep
            file={selectedFile}
            signingMode={signingMode}
            onComplete={handleSigningComplete}
          />
        )}

        {currentStep === 'complete' && (
          <CompletionStep
            onDownload={handleDownloadSigned}
            onSignAnother={resetWorkflow}
          />
        )}
      </div>
    </div>
  );
};

export default SignPDF;
