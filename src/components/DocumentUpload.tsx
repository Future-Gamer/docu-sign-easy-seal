
import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload, X } from 'lucide-react';
import PDFPreview from './PDFPreview';

interface DocumentUploadProps {
  onUpload: (file: File) => void;
}

const DocumentUpload = ({ onUpload }: DocumentUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      setSelectedFile(pdfFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsUploading(false);
          onUpload(selectedFile);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  if (selectedFile && !isUploading && uploadProgress < 100) {
    return (
      <div className="space-y-6">
        <PDFPreview file={selectedFile} onRemove={handleRemoveFile} />
        <div className="text-center">
          <Button onClick={handleFileUpload} size="lg">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Upload Document</span>
        </CardTitle>
        <CardDescription>
          Upload a PDF document to prepare for signature
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-600 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Uploading document...</p>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-gray-500">{uploadProgress}% complete</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <FileText className="h-12 w-12 text-gray-400 mx-auto" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-100">
                  Drop your PDF here, or browse
                </p>
                <p className="text-sm text-gray-400">
                  Supports PDF files up to 10MB
                </p>
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild className="cursor-pointer">
                  <span>Browse Files</span>
                </Button>
              </label>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
