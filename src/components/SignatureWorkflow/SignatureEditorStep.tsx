
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PDFProcessor } from '@/services/pdfProcessor';
import PDFViewer from '../PDFViewer';
import SignatureDetailsModal, { SignatureDetails } from './SignatureDetailsModal';
import SignatureFieldSidebar from './SignatureFieldSidebar';
import DraggableField from './DraggableField';

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

interface SignatureEditorStepProps {
  file: File;
  signingMode: 'self' | 'multiple';
  onComplete: (signedBlob: Blob) => void;
}

const SignatureEditorStep: React.FC<SignatureEditorStepProps> = ({
  file,
  signingMode,
  onComplete
}) => {
  const [showSignatureModal, setShowSignatureModal] = useState(true);
  const [signatureDetails, setSignatureDetails] = useState<SignatureDetails | null>(null);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

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

  const handleSign = async () => {
    if (!file || signatureFields.length === 0 || !signatureDetails) {
      toast({
        title: 'Missing requirements',
        description: 'Please add at least one signature field',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const fileBuffer = await file.arrayBuffer();
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
      
      onComplete(signedBlob);
      
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

  return (
    <>
      <div className="flex-1 bg-white relative">
        <PDFViewer
          file={file}
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
        isProcessing={isProcessing}
      />

      {/* Modals */}
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
    </>
  );
};

export default SignatureEditorStep;
