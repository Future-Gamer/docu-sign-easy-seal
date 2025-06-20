
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocumentCard from './DocumentCard';
import DocumentUpload from './DocumentUpload';
import { Plus, Search } from 'lucide-react';

interface DashboardProps {
  user: { name: string; email: string };
}

const Dashboard = ({ user }: DashboardProps) => {
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock documents data
  const [documents] = useState([
    {
      id: '1',
      name: 'Contract Agreement.pdf',
      uploadDate: '2 days ago',
      status: 'pending' as const,
      signers: ['john@example.com'],
      size: '2.4 MB'
    },
    {
      id: '2',
      name: 'Employment Agreement.pdf',
      uploadDate: '1 week ago',
      status: 'signed' as const,
      signers: ['alice@example.com', 'bob@example.com'],
      size: '1.8 MB'
    },
    {
      id: '3',
      name: 'NDA Document.pdf',
      uploadDate: '2 weeks ago',
      status: 'completed' as const,
      signers: ['client@company.com'],
      size: '890 KB'
    }
  ]);

  const handleUpload = (file: File) => {
    console.log('Uploading file:', file.name);
    setShowUpload(false);
    // Here you would typically handle the file upload to your backend
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
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
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
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="signed">Signed</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onView={handleViewDocument}
                  onSign={handleSignDocument}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No documents found</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments
              .filter(doc => doc.status === 'pending')
              .map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onView={handleViewDocument}
                  onSign={handleSignDocument}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="signed" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments
              .filter(doc => doc.status === 'signed')
              .map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onView={handleViewDocument}
                  onSign={handleSignDocument}
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
                  document={doc}
                  onView={handleViewDocument}
                  onSign={handleSignDocument}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
