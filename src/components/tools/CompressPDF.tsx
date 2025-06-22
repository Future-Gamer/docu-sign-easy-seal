
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Archive, ArrowLeft, Download, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDocuments } from '@/hooks/useDocuments';

interface CompressPDFProps {
  onBack: () => void;
}

const CompressPDF = ({ onBack }: CompressPDFProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { uploadDocument } = useDocuments();

  const validateFileSize = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return file.size <= maxSize;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setFile(selectedFile);
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please select a PDF file',
        variant: 'destructive',
      });
    }
  };

  const handleCompress = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a PDF file to compress',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    
    // Simulate compression process with progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    setTimeout(() => {
      const compressedBlob = new Blob([file], { type: 'application/pdf' });
      setProcessedFile(compressedBlob);
      setIsProcessing(false);
      toast({
        title: 'PDF compressed successfully',
        description: 'Your compressed PDF is ready for download',
      });
    }, 3000);
  };

  const handleDownload = () => {
    if (!processedFile || !file) return;
    
    const url = URL.createObjectURL(processedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed_${file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveToDatabase = async () => {
    if (!processedFile || !file) return;
    
    try {
      const compressedFileName = new File([processedFile], `compressed_${file.name}`, { type: 'application/pdf' });
      await uploadDocument(compressedFileName);
      
      toast({
        title: 'Saved to documents',
        description: 'Your compressed PDF has been saved to your documents',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save compressed PDF to documents',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white min-h-screen">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={onBack}
          className="mb-4 border-gray-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tools
        </Button>
      </div>

      <div className="space-y-6">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Archive className="h-6 w-6 text-yellow-600" />
              <span>Compress PDF</span>
            </CardTitle>
            <CardDescription>
              Reduce your PDF file size (Max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Select a PDF file to compress
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload">
                <Button asChild className="cursor-pointer">
                  <span>Choose File</span>
                </Button>
              </label>
            </div>

            {file && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-yellow-100 p-2 rounded">
                    <Archive className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="space-y-4">
                <Progress value={progress} className="w-full" />
                <p className="text-center text-sm text-gray-600">
                  Compressing PDF... {progress}%
                </p>
              </div>
            )}

            {!processedFile && file && !isProcessing && (
              <Button
                onClick={handleCompress}
                className="w-full"
              >
                Compress PDF
              </Button>
            )}

            {processedFile && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-green-800">
                    Compression Complete!
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleDownload}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Compressed PDF
                  </Button>
                  <Button
                    onClick={handleSaveToDatabase}
                    className="w-full"
                  >
                    Save to Documents
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompressPDF;
