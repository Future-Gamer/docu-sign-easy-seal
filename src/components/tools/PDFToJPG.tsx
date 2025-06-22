
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileImage, ArrowLeft, Download, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PDFToJPGProps {
  onBack: () => void;
}

const PDFToJPG = ({ onBack }: PDFToJPGProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<Blob[]>([]);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

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

  const handleConvert = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a PDF file to convert',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    
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
      // Create mock JPG files (simulating 3 pages)
      const mockImages = Array.from({ length: 3 }, (_, i) => 
        new Blob([`mock image data for page ${i + 1}`], { type: 'image/jpeg' })
      );
      setProcessedFiles(mockImages);
      setIsProcessing(false);
      toast({
        title: 'PDF converted successfully',
        description: 'Your JPG images are ready for download',
      });
    }, 3000);
  };

  const handleDownloadAll = () => {
    if (!processedFiles.length || !file) return;
    
    processedFiles.forEach((blob, index) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_page_${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
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
              <FileImage className="h-6 w-6 text-green-600" />
              <span>PDF to JPG</span>
            </CardTitle>
            <CardDescription>
              Convert PDF pages to JPG images (Max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Select a PDF file to convert
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
                  <div className="bg-green-100 p-2 rounded">
                    <FileImage className="h-4 w-4 text-green-600" />
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
                  Converting to JPG... {progress}%
                </p>
              </div>
            )}

            {processedFiles.length === 0 && file && !isProcessing && (
              <Button
                onClick={handleConvert}
                className="w-full"
              >
                Convert to JPG
              </Button>
            )}

            {processedFiles.length > 0 && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-green-800">
                    Conversion Complete!
                  </p>
                  <p className="text-sm text-green-600">
                    {processedFiles.length} JPG files ready for download
                  </p>
                </div>
                
                <Button
                  onClick={handleDownloadAll}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All JPG Files
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PDFToJPG;
