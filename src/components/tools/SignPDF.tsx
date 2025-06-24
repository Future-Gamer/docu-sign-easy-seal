
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, FileText, Download, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PDFProcessor } from '@/services/pdfProcessor';
import PDFViewer from '../PDFViewer';
import SigningModeSelector from '../SignatureWorkflow/SigningModeSelector';
import SignatureDetailsModal, { SignatureDetails } from '../SignatureWorkflow/SignatureDetailsModal';
import SignatureFieldSidebar from '../SignatureWorkflow/SignatureFieldSidebar';
import DraggableField from '../SignatureWorkflow/DraggableField';

interface SignPDFProps {
  onBack: () => void;
}

type WorkflowStep = 'upload' | 'mode-selection' | 'editor' | 'complete';

interface SignatureField {
  id: string;
  type: 'signature' | 'initials' | 'name' | 'date' | 'text' | 'company_stamp';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  value?: string;
  isRequired: boolean;
}

const SignPDF = ({ onBack }: SignPDFProps) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [signingMode, setSigningMode] = useState<'self' | 'multiple'>('self');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureDetails, setSignatureDetails] = useState<SignatureDetails | null>(null);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [signedPdfBlob, setSignedPdfBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Predefined field templates
  const requiredFields = [
    {
      id: 'signature',
      type: 'signature' as const,
      label: 'Signature',
      icon: <div className="text-blue-500">✍️</div>,
      isRequired: true
    }
  ];

  const optionalFields = [
    {
      id: 'initials',
      type: 'initials' as const,
      label: 'Initials',
      icon: <div className="text-green-500">AC</div>,
      isRequired: false
    },
    {
      id: 'name',
      type: 'name' as const,
      label: 'Name',
      icon: <div className="text-purple-500">👤</div>,
      isRequired: false
    },
    {
      id: 'date',
      type: 'date' as const,
      label: 'Date',
      icon: <div className="text-orange-500">📅</div>,
      isRequired: false
    },
    {
      id: 'text',
      type: 'text' as const,
      label: 'Text',
      icon: <div className="text-gray-500">📝</div>,
      isRequired: false
    },
    {
      id: 'company_stamp',
      type: 'company_stamp' as const,
      label: 'Company Stamp',
      icon: <div className="text-red-500">🏢</div>,
      isRequired: false
    }
  ];

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

  // Step 2: Mode Selection
  const handleModeSelection = (mode: 'self' | 'multiple') => {
    setSigningMode(mode);
    setCurrentStep('editor');
    
    // Auto-open signature details modal
    setTimeout(() => {
      setShowSignatureModal(true);
    }, 500);
  };

  // Step 3: Signature Details
  const handleSignatureDetailsSave = (details: SignatureDetails) => {
    setSignatureDetails(details);
    setShowSignatureModal(false);
    
    // Auto-add signature field
    const signatureField: SignatureField = {
      id: `signature_${Date.now()}`,
      type: 'signature',
      label: 'Signature',
      x: 20,
      y: 70,
      width: 200,
      height: 80,
      pageNumber: 1,
      value: details.signatureData || details.fullName,
      isRequired: true
    };
    
    setSignatureFields([signatureField]);
    
    toast({
      title: 'Signature added',
      description: 'Drag the signature to position it on the document',
    });
  };

  // Field Management
  const handleAddField = (fieldType: string) => {
    if (!signatureDetails) {
      setShowSignatureModal(true);
      return;
    }

    const newField: SignatureField = {
      id: `${fieldType}_${Date.now()}`,
      type: fieldType as any,
      label: fieldType.charAt(0).toUpperCase() + fieldType.slice(1),
      x: 20,
      y: 20,
      width: fieldType === 'signature' ? 200 : fieldType === 'initials' ? 100 : 150,
      height: fieldType === 'signature' ? 80 : 50,
      pageNumber: 1,
      value: getFieldValue(fieldType),
      isRequired: fieldType === 'signature'
    };

    setSignatureFields(prev => [...prev, newField]);
  };

  const getFieldValue = (fieldType: string): string => {
    if (!signatureDetails) return '';
    
    switch (fieldType) {
      case 'signature':
        return signatureDetails.signatureData || signatureDetails.fullName;
      case 'initials':
        return signatureDetails.initials;
      case 'name':
        return signatureDetails.fullName;
      case 'date':
        return new Date().toLocaleDateString();
      default:
        return '';
    }
  };

  const handleFieldPositionChange = (id: string, x: number, y: number) => {
    setSignatureFields(prev => prev.map(field => 
      field.id === id ? { ...field, x, y } : field
    ));
  };

  const handleFieldRemove = (id: string) => {
    setSignatureFields(prev => prev.filter(field => field.id !== id));
  };

  // Step 4: Generate Signed PDF
  const handleSign = async () => {
    if (!selectedFile || signatureFields.length === 0 || !signatureDetails) {
      toast({
        title: 'Missing requirements',
        description: 'Please add at least one signature field',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      const signaturePositions = signatureFields.map(field => ({
        x: field.x,
        y: field.y,
        signatureData: field.value || signatureDetails.signatureData || signatureDetails.fullName,
        pageNumber: field.pageNumber,
        width: field.width,
        height: field.height,
        fieldType: field.type
      }));

      const signedPdfBytes = await PDFProcessor.addSignaturesToPDF(fileBuffer, signaturePositions);
      const signedBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      
      setSignedPdfBlob(signedBlob);
      setCurrentStep('complete');
      
      toast({
        title: 'PDF signed successfully!',
        description: 'Your document is ready for download',
      });

    } catch (error) {
      console.error('Error signing PDF:', error);
      toast({
        title: 'Signing failed',
        description: 'Failed to generate signed PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
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
    setSignatureFields([]);
    setSignatureDetails(null);
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
        {/* Upload Step */}
        {currentStep === 'upload' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-md w-full mx-4">
              <div className="text-center mb-8">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Select PDF to Sign</h2>
                <p className="text-gray-600">Choose a PDF file to add your digital signature</p>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
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
                <p className="text-sm text-gray-500 mt-2">Maximum file size: 25MB</p>
              </div>
            </div>
          </div>
        )}

        {/* Editor Step */}
        {currentStep === 'editor' && selectedFile && (
          <>
            <div className="flex-1 bg-white">
              <PDFViewer
                file={selectedFile}
                signatures={signatureFields.map(field => ({
                  id: field.id,
                  signature: field.value || '',
                  x: field.x,
                  y: field.y,
                  pageNumber: field.pageNumber
                }))}
                onSignaturePositionChange={handleFieldPositionChange}
                onSignatureRemove={handleFieldRemove}
              />
              
              {/* Overlay signature fields */}
              {signatureFields.map((field) => (
                <DraggableField
                  key={field.id}
                  id={field.id}
                  type={field.type}
                  label={field.label}
                  initialX={field.x}
                  initialY={field.y}
                  width={field.width}
                  height={field.height}
                  onPositionChange={handleFieldPositionChange}
                  onRemove={handleFieldRemove}
                  value={field.value}
                />
              ))}
            </div>
            
            <SignatureFieldSidebar
              onAddField={handleAddField}
              requiredFields={requiredFields}
              optionalFields={optionalFields}
              onSign={handleSign}
            />
          </>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-4">Document Signed Successfully!</h2>
              <p className="text-gray-600 mb-8">Your PDF has been digitally signed and is ready for download</p>
              
              <div className="space-y-4">
                <Button
                  onClick={handleDownloadSigned}
                  className="bg-blue-500 hover:bg-blue-600 px-8"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Signed PDF
                </Button>
                
                <div>
                  <Button onClick={resetWorkflow} variant="outline">
                    Sign Another Document
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {currentStep === 'mode-selection' && selectedFile && (
        <SigningModeSelector
          onSelectMode={handleModeSelection}
          documentName={selectedFile.name}
        />
      )}

      {showSignatureModal && (
        <SignatureDetailsModal
          onClose={() => setShowSignatureModal(false)}
          onSave={handleSignatureDetailsSave}
          initialDetails={signatureDetails || undefined}
        />
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Processing your signed PDF...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignPDF;
