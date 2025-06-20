import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocumentCard from './DocumentCard';
import DocumentUpload from './DocumentUpload';
import { Plus, Search } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';

interface DashboardProps {
  user: { id: string; email?: string };
}

const Dashboard = ({ user }: DashboardProps) => {
  const { documents, loading, uploadDocument, deleteDocument } = useDocuments();
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleUpload = async (file: File) => {
    await uploadDocument(file);
    setShowUpload(false);
  };

  const handleViewDocument = (id: string) => {
    console.log('Viewing document:', id);
    // Navigate to document viewer
  };

  const handleSignDocument = (id: string) => {
    console.log('Signing document:', id);
    // Navigate to signature interface
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
