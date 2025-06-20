
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye } from 'lucide-react';

interface PDFPreviewProps {
  file: File;
  onRemove: () => void;
}

const PDFPreview = ({ file, onRemove }: PDFPreviewProps) => {
  const fileUrl = URL.createObjectURL(file);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>PDF Preview</span>
          </div>
          <Button variant="outline" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-white">{file.name}</p>
                <p className="text-sm text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <div className="w-full h-96 bg-gray-700 rounded border flex items-center justify-center">
              <iframe
                src={fileUrl}
                className="w-full h-full rounded"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFPreview;
