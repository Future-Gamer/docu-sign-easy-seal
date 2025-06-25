
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, ArrowLeft } from 'lucide-react';
import DocumentCard from './DocumentCard';
import DocumentUpload from './DocumentUpload';
import DocumentViewer from './DocumentViewer';
import SignPDF from './tools/SignPDF';
import { useDocuments } from '@/hooks/useDocuments';

interface DashboardProps {
  user: { id: string; email?: string };
}

const Dashboard = ({ user }: DashboardProps) => {
  const { documents, loading, uploadDocument, deleteDocument, getDocumentUrl } = useDocuments();
  const [showUpload, setShowUpload] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSignPDF, setShowSignPDF] = useState(false);

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

  if (showSignPDF) {
    return <SignPDF onBack={() => setShowSignPDF(false)} />;
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

        {/* Sign PDF Section - Updated to use the new SignPDF component */}
        <Card className="mb-8 bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-xl">
              <div className="text-blue-500">✍️</div>
              <span>Sign PDF Document</span>
            </CardTitle>
            <CardDescription>
              Upload a PDF and add your signature with our step-by-step process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Button 
                onClick={() => setShowSignPDF(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 text-lg"
              >
                Start Signing Process
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Follow our guided process: Upload → Select Mode → Add Signature → Download
              </p>
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
