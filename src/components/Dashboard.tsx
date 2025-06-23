import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import DocumentCard from './DocumentCard';
import DocumentUpload from './DocumentUpload';
import DocumentViewer from './DocumentViewer';
import SignatureCanvas from './SignatureCanvas';
import DraggableSignature from './DraggableSignature';
import { Plus, Search, PenTool, Upload, Download, ArrowLeft, CheckCircle } from 'lucide-react';
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  // File size validation (10MB limit)
  const validateFileSize = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    return file.size <= maxSize;
  };

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
      if (!validateFileSize(selectedFile)) {
        toast({
          title: 'File too large',
          description: 'Please select a PDF file smaller than 10MB',
          variant: 'destructive',
        });
        return;
      }
      setSignFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setSignPDFStep('edit'); // Changed from 'upload' to 'edit'
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
    setUploadProgress(0);
    
    // Simulate signing process with progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    setTimeout(async () => {
      try {
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
      
      resetSignPDFFlow();
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
    setUploadProgress(0);
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.original_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showUpload) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white min-h-screen">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowUpload(false)}
            className="mb-4 border-gray-300 hover:bg-gray-50"
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white min-h-screen">
        <div className="mb-6">
          <Button variant="outline" onClick={resetSignPDFFlow} className="mb-4 border-gray-300 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-8">
          {signPDFStep === 'edit' && (
            <>
              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-gray-800">Step 1: Signer Information</CardTitle>
                  <CardDescription className="text-gray-600">
                    Enter the details of the person signing this document
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-medium text-gray-800 text-sm">{signFile?.name}</p>
                    <p className="text-xs text-gray-500">
                      {signFile ? (signFile.size / 1024 / 1024).toFixed(2) : 0} MB
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Full Name"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="bg-white border-gray-300"
                    />
                    <Input
                      type="email"
                      placeholder="Email Address"
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                      className="bg-white border-gray-300"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-gray-800">Step 2: Create Signature</CardTitle>
                  <CardDescription className="text-gray-600">
                    Draw your signature using the canvas below
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SignatureCanvas onSignatureChange={handleSignatureChange} />
                  {currentSignature && (
                    <Button className="w-full mt-4 bg-blue-500 hover:bg-blue-600" onClick={handleAddSignature}>
                      Add Signature to Document
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-gray-800">Step 3: Position Signature</CardTitle>
                  <CardDescription className="text-gray-600">
                    Preview your document and drag signatures to position them
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden" style={{ height: '600px' }}>
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
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {isProcessing && (
                <Card className="border-gray-200 bg-white">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <Progress value={uploadProgress} className="w-full h-2" />
                      <p className="text-center text-sm text-gray-600">
                        Processing PDF... {uploadProgress}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-gray-800">Step 4: Save Document</CardTitle>
                  <CardDescription className="text-gray-600">
                    Review and save your signed document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleSaveSignedPDF}
                    disabled={isProcessing || !signerName || !signerEmail || signatures.length === 0}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    {isProcessing ? 'Processing...' : 'Save Signed PDF'}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {signPDFStep === 'output' && (
            <div className="space-y-6">
              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-center flex items-center justify-center space-x-2">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="text-gray-800">PDF Signed Successfully!</span>
                  </CardTitle>
                  <CardDescription className="text-center text-gray-600">
                    Your PDF has been signed and is ready for download or saving
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-8 bg-green-50 rounded-lg border border-green-200 text-center">
                    <div className="text-green-500 mb-4">
                      <PenTool className="h-16 w-16 mx-auto" />
                    </div>
                    <p className="font-medium text-green-800 text-lg mb-2">
                      {signFile?.name}
                    </p>
                    <p className="text-sm text-green-600">
                      Successfully signed with {signatures.length} signature{signatures.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={handleDownloadSigned}
                      className="w-full bg-blue-500 hover:bg-blue-600"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Only
                    </Button>
                    <Button
                      onClick={handleSaveToDatabase}
                      className="w-full bg-green-500 hover:bg-green-600"
                    >
                      Save to Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white min-h-screen">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
            <p className="text-gray-600">Manage your documents and signatures</p>
          </div>
          <Button onClick={() => setShowUpload(true)} className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600">
            <Plus className="h-4 w-4" />
            <span>New Document</span>
          </Button>
        </div>

        {/* Sign PDF Section */}
        <Card className="mb-8 bg-white border-gray-200">
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
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Select a PDF file to sign
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Follow our guided process: Upload → Edit → Save → Download (Max 10MB)
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleSignFileSelect}
                className="hidden"
                id="sign-pdf-upload"
              />
              <label htmlFor="sign-pdf-upload">
                <Button asChild className="cursor-pointer bg-blue-500 hover:bg-blue-600">
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
              className="pl-10 bg-white border-gray-300"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6 bg-gray-100">
          <TabsTrigger value="all" className="data-[state=active]:bg-white">All Documents</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-white">Active</TabsTrigger>
          <TabsTrigger value="processing" className="data-[state=active]:bg-white">Processing</TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-white">Completed</TabsTrigger>
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
