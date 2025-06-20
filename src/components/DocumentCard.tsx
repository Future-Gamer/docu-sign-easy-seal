
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, User } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  uploadDate: string;
  status: 'pending' | 'signed' | 'completed';
  signers: string[];
  size: string;
}

interface DocumentCardProps {
  document: Document;
  onView: (id: string) => void;
  onSign: (id: string) => void;
}

const DocumentCard = ({ document, onView, onSign }: DocumentCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'signed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{document.name}</CardTitle>
              <CardDescription className="flex items-center space-x-4 mt-1">
                <span>Uploaded {document.uploadDate}</span>
                <span>•</span>
                <span>{document.size}</span>
              </CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor(document.status)}>
            {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{document.signers.length} signer{document.signers.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => onView(document.id)}>
              View
            </Button>
            {document.status === 'pending' && (
              <Button size="sm" onClick={() => onSign(document.id)}>
                Sign
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentCard;
