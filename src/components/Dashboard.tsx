
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DocumentCard from './DocumentCard';
import DocumentUpload from './DocumentUpload';
import DocumentViewer from './DocumentViewer';
import SignatureCanvas from './SignatureCanvas';
import DraggableSignature from './DraggableSignature';
import { Plus, Search, PenTool, Upload, Download, ArrowLeft } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { useToast } from '@/hooks/use-toast';

interface DashboardProps {
  user: { id: string; email?: string };
}

const Dashboard = ({ user }: DashboardProps) => {
  const { documents, loading, uploadDocument, deleteDocument, getDocumentUrl } = useDocuments();
  const [showUpload, setShowUpload] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sign PDF flow state
  const [signPDFStep, setSignPDFStep] = useState<'upload' | 'edit' | 'output' | null>(null);
  const [signFile, setSignFile] = useState<File | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);
  const [signatures, setSignatures] = useState<Array<{ id: string; signature: string; x: number; y: number }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUpload = async (file: File) => {
    await uploadDocument(file);
    setShowUpload(false);
  };

  const handleViewDocument = (id: string) => {
    setViewingDocument(id);
  };

  const handleSignDocument = (id: string) => {
    setViewingDocument(id);
  };

  const handleDownloadDocument = (id: string) => {
    const doc = documents.find(doc => doc.id === id);
    if (doc) {
      const url = getDocumentUrl(doc.file_path);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.original_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  // Sign PDF handlers
  const handleSignFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setSignFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setSignPDFStep('edit');
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

  const handleSaveSignedPDF = async () => {
    if (!signFile || !signerName || !signerEmail || signatures.length === 0) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all fields and add at least one signature',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate signing process
    setTimeout(async () => {
      try {
        // Create a signed PDF blob (in real implementation, use PDF-lib)
        const signedBlob = new Blob([signFile], { type: 'application/pdf' });
        setProcessedFile(signedBlob);
        
        setIsProcessing(false);
        setSignPDFStep('output');
        toast({
          title: 'PDF signed successfully',
          description: 'Your signed PDF is ready',
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

  const handleDownloadSigned = () => {
    if (!processedFile || !signFile) return;
    
    const url = URL.createObjectURL(processedFile);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `signed_${signFile.name}`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveToDatabase = async () => {
    if (!processedFile || !signFile) return;
    
    try {
      const signedFileName = new File([processedFile], `signed_${signFile.name}`, { type: 'application/pdf' });
      await uploadDocument(signedFileName);
      
      toast({
        title: 'Saved to documents',
        description: 'Your signed PDF has been saved to your documents',
      });
      
      // Reset the sign PDF flow
      setSignPDFStep(null);
      setSignFile(null);
      setSignatures([]);
      setProcessedFile(null);
      setPreviewUrl(null);
      setSignerName('');
      setSignerEmail('');
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save signed PDF to documents',
        variant: 'destructive',
      });
    }
  };

  const resetSignPDFFlow = () => {
    setSignPDFStep(null);
    setSignFile(null);
    setSignatures([]);
    setProcessedFile(null);
    setPreviewUrl(null);
    setSignerName('');
    setSignerEmail('');
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.original_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showUpload) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowUpload(false)}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
        </div>
        <DocumentUpload onUpload={handleUpload} />
      </div>
    );
  }

  if (viewingDocument) {
    const document = documents.find(doc => doc.id === viewingDocument);
    if (!document) return null;

    return (
      <DocumentViewer
        documentUrl={getDocumentUrl(document.file_path)}
        documentName={document.name}
        onBack={() => setViewingDocument(null)}
        onDownload={() => handleDownloadDocument(viewingDocument)}
        showSigningInterface={true}
      />
    );
  }

  // Sign PDF Flow Render
  if (signPDFStep) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={resetSignPDFFlow} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {signPDFStep === 'edit' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Signer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="font-medium text-gray-900 text-sm">{signFile?.name}</p>
                    <p className="text-xs text-gray-500">
                      {signFile ? (signFile.size / 1024 / 1024).toFixed(2) : 0} MB
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Input
                      placeholder="Signer name"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                    />
                    <Input
                      type="email"
                      placeholder="Signer email"
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleSaveSignedPDF}
                    disabled={isProcessing || !signerName || !signerEmail || signatures.length === 0}
                    className="w-full"
                  >
                    {isProcessing ? 'Processing...' : 'Save Signed PDF'}
                  </Button>
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

            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Document Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-96 bg-gray-100 rounded border overflow-hidden">
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
          </div>
        )}

        {signPDFStep === 'output' && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">PDF Signed Successfully!</CardTitle>
                <CardDescription className="text-center">
                  Your PDF has been signed and is ready for download or saving
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 bg-green-50 rounded-lg border border-green-200 text-center">
                  <div className="text-green-600 mb-2">
                    <PenTool className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="font-medium text-green-800">
                    Signed: {signFile?.name}
                  </p>
                  <p className="text-sm text-green-600">
                    Signatures added: {signatures.length}
                  </p>
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={handleDownloadSigned}
                    className="flex-1"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Only
                  </Button>
                  <Button
                    onClick={handleSaveToDatabase}
                    className="flex-1"
                  >
                    Save to Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
            <p className="text-gray-600">Manage your documents and signatures</p>
          </div>
          <Button onClick={() => setShowUpload(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Document</span>
          </Button>
        </div>

        {/* Sign PDF Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PenTool className="h-6 w-6 text-blue-500" />
              <span>Sign PDF Document</span>
            </CardTitle>
            <CardDescription>
              Upload a PDF and add your signature with our step-by-step process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Select a PDF file to sign
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Follow our guided process: Upload → Edit → Save → Download
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleSignFileSelect}
                className="hidden"
                id="sign-pdf-upload"
              />
              <label htmlFor="sign-pdf-upload">
                <Button asChild className="cursor-pointer">
                  <span>Choose PDF to Sign</span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading documents...</p>
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={{
                    id: doc.id,
                    name: doc.name,
                    uploadDate: new Date(doc.created_at).toLocaleDateString(),
                    status: doc.status as 'pending' | 'signed' | 'completed',
                    signers: [],
                    size: `${(doc.file_size / 1024 / 1024).toFixed(2)} MB`
                  }}
                  onView={handleViewDocument}
                  onSign={handleSignDocument}
                  onDelete={() => deleteDocument(doc.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No documents found</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments
              .filter(doc => doc.status === 'active')
              .map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={{
                    id: doc.id,
                    name: doc.name,
                    uploadDate: new Date(doc.created_at).toLocaleDateString(),
                    status: doc.status as 'pending' | 'signed' | 'completed',
                    signers: [],
                    size: `${(doc.file_size / 1024 / 1024).toFixed(2)} MB`
                  }}
                  onView={handleViewDocument}
                  onSign={handleSignDocument}
                  onDelete={() => deleteDocument(doc.id)}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments
              .filter(doc => doc.status === 'processing')
              .map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={{
                    id: doc.id,
                    name: doc.name,
                    uploadDate: new Date(doc.created_at).toLocaleDateString(),
                    status: doc.status as 'pending' | 'signed' | 'completed',
                    signers: [],
                    size: `${(doc.file_size / 1024 / 1024).toFixed(2)} MB`
                  }}
                  onView={handleViewDocument}
                  onSign={handleSignDocument}
                  onDelete={() => deleteDocument(doc.id)}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments
              .filter(doc => doc.status === 'completed')
              .map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={{
                    id: doc.id,
                    name: doc.name,
                    uploadDate: new Date(doc.created_at).toLocaleDateString(),
                    status: doc.status as 'pending' | 'signed' | 'completed',
                    signers: [],
                    size: `${(doc.file_size / 1024 / 1024).toFixed(2)} MB`
                  }}
                  onView={handleViewDocument}
                  onSign={handleSignDocument}
                  onDelete={() => deleteDocument(doc.id)}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
