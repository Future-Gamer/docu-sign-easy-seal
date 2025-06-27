
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import PDFViewer from '../PDFViewer';
import SignatureDetailsModal, { SignatureDetails } from './SignatureDetailsModal';
import SignatureFieldSidebar from './SignatureFieldSidebar';
import DraggableField from './DraggableField';
import CompanyStampUploadModal from './CompanyStampUploadModal';
import { SignatureFieldManager, SignatureField } from './SignatureFieldManager';
import { SignatureFieldConfig } from './SignatureFieldConfig';
import { PDFSigningProcessor } from './PDFSigningProcessor';

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
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showCompanyStampModal, setShowCompanyStampModal] = useState(false);
  const [signatureDetails, setSignatureDetails] = useState<SignatureDetails | null>(null);
  const [companyStampImage, setCompanyStampImage] = useState<string | null>(null);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfScale, setPdfScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfContainerDimensions, setPdfContainerDimensions] = useState({ width: 800, height: 600 });
  const { toast } = useToast();

  const handleSignatureDetailsSave = (details: SignatureDetails) => {
    console.log('Signature details saved:', details);
    setSignatureDetails(details);
    setShowSignatureModal(false);
    
    toast({
      title: 'Signature details saved',
      description: 'You can now add signature fields to the document',
    });
  };

  const handleCompanyStampUpload = (stampImage: string) => {
    setCompanyStampImage(stampImage);
    setShowCompanyStampModal(false);
    
    toast({
      title: 'Company stamp uploaded',
      description: 'You can now add company stamp fields to the document',
    });
  };

  const handleAddField = (fieldType: string) => {
    console.log('Adding field:', fieldType, 'on page:', currentPage);
    
    if (fieldType === 'signature' && !signatureDetails) {
      setShowSignatureModal(true);
      return;
    }

    if (fieldType === 'company_stamp' && !companyStampImage) {
      setShowCompanyStampModal(true);
      return;
    }

    const newField = SignatureFieldManager.createField(fieldType, signatureDetails, companyStampImage, currentPage);
    setSignatureFields(prev => [...prev, newField]);
    
    toast({
      title: 'Field added',
      description: `${fieldType} field added to page ${currentPage}. Drag it to position on the document.`,
    });
  };

  const handleFieldPositionChange = (id: string, x: number, y: number) => {
    console.log('Field position changed:', id, x, y, 'on page:', currentPage);
    setSignatureFields(prev => prev.map(field => 
      field.id === id ? { ...field, x, y, pageNumber: currentPage } : field
    ));
  };

  const handleFieldRemove = (id: string) => {
    console.log('Removing field:', id);
    setSignatureFields(prev => prev.filter(field => field.id !== id));
    
    toast({
      title: 'Field removed',
      description: 'Field has been removed from the document',
    });
  };

  const handleFieldEdit = (id: string) => {
    const field = signatureFields.find(f => f.id === id);
    if (!field) return;

    if (field.type === 'text') {
      const newText = prompt('Enter custom text:', field.value || '');
      if (newText !== null) {
        setSignatureFields(prev => prev.map(f => 
          f.id === id ? { ...f, value: newText } : f
        ));
      }
    }
  };

  const handlePageChange = (pageNumber: number) => {
    console.log('Page changed to:', pageNumber);
    setCurrentPage(pageNumber);
  };

  const handleSign = async () => {
    if (!file || signatureFields.length === 0) {
      toast({
        title: 'Missing requirements',
        description: 'Please add at least one signature field',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Signing PDF with fields:', signatureFields);
      const signedBlob = await PDFSigningProcessor.signPDF(file, signatureFields);
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

  // Get fields for current page only
  const currentPageFields = signatureFields.filter(field => field.pageNumber === currentPage);

  return (
    <div className="flex h-full w-full bg-gray-50">
      {/* Document Viewer Container */}
      <div className="flex-1 bg-white relative overflow-hidden min-w-0">
        <div className="relative w-full h-full">
          <PDFViewer
            file={file}
            signatures={[]}
            onSignaturePositionChange={() => {}}
            onSignatureRemove={() => {}}
            onScaleChange={setPdfScale}
            onContainerDimensionsChange={setPdfContainerDimensions}
            onPageChange={handlePageChange}
          />
          
          {/* Fixed Position Overlay for Draggable Fields - Only for Current Page */}
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              top: '60px',
              left: '16px',
              right: '16px',
              bottom: '16px'
            }}
          >
            <div className="relative w-full h-full pointer-events-none">
              {currentPageFields.map((field) => (
                <div key={field.id} className="pointer-events-auto">
                  <DraggableField
                    id={field.id}
                    type={field.type}
                    label={field.label}
                    initialX={field.x}
                    initialY={field.y}
                    width={field.width}
                    height={field.height}
                    onPositionChange={handleFieldPositionChange}
                    onRemove={handleFieldRemove}
                    onEdit={handleFieldEdit}
                    value={field.value}
                    containerWidth={pdfContainerDimensions.width - 32}
                    containerHeight={pdfContainerDimensions.height - 76}
                    scale={pdfScale}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Sidebar */}
      <div className="flex-shrink-0 w-80 bg-white border-l border-gray-200">
        <SignatureFieldSidebar
          onAddField={handleAddField}
          requiredFields={SignatureFieldConfig.requiredFields}
          optionalFields={SignatureFieldConfig.optionalFields}
          onSign={handleSign}
          isProcessing={isProcessing}
          currentPage={currentPage}
          totalFields={signatureFields.length}
          currentPageFields={currentPageFields.length}
        />
      </div>

      {/* Modals */}
      {showSignatureModal && (
        <SignatureDetailsModal
          onClose={() => setShowSignatureModal(false)}
          onSave={handleSignatureDetailsSave}
          initialDetails={signatureDetails || undefined}
        />
      )}

      {showCompanyStampModal && (
        <CompanyStampUploadModal
          onClose={() => setShowCompanyStampModal(false)}
          onSave={handleCompanyStampUpload}
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

export default SignatureEditorStep;
