
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileImage, ArrowLeft, Download, CheckCircle, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PDFProcessor } from '@/services/pdfProcessor';

interface PDFToJPGProps {
  onBack: () => void;
}

const PDFToJPG = ({ onBack }: PDFToJPGProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<{ blob: Blob; name: string }[]>([]);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const validateFileSize = (file: File) => {
    const maxSize = 25 * 1024 * 1024; // 25MB
    return file.size <= maxSize;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      if (!validateFileSize(selectedFile)) {
        toast({
          title: 'File too large',
          description: 'Please select a PDF file smaller than 25MB',
          variant: 'destructive',
        });
        return;
      }

      const isValid = await PDFProcessor.validatePDF(selectedFile);
      if (!isValid) {
        toast({
          title: 'Invalid PDF',
          description: 'The selected file is not a valid PDF',
          variant: 'destructive',
        });
        return;
      }

      setFile(selectedFile);
      setProcessedFiles([]);
      setProgress(0);
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
    
    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 200);

      const arrayBuffer = await file.arrayBuffer();
      const imageBlobs = await PDFProcessor.convertPDFToImages(arrayBuffer);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      const processedFilesData = imageBlobs.map((blob, index) => ({
        blob,
        name: `${file.name.replace('.pdf', '')}_page_${index + 1}.jpg`
      }));

      setProcessedFiles(processedFilesData);
      setIsProcessing(false);
      
      toast({
        title: 'PDF converted successfully',
        description: `Converted to ${imageBlobs.length} JPG images`,
      });
    } catch (error) {
      console.error('Conversion error:', error);
      setIsProcessing(false);
      setProgress(0);
      toast({
        title: 'Conversion failed',
        description: 'Failed to convert PDF to JPG. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadAll = () => {
    if (!processedFiles.length) return;
    
    processedFiles.forEach(({ blob, name }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    toast({
      title: 'Downloads started',
      description: `Downloading ${processedFiles.length} JPG files`,
    });
  };

  const handleDownloadSingle = (fileData: { blob: Blob; name: string }) => {
    const url = URL.createObjectURL(fileData.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileData.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
              Convert PDF pages to high-quality JPG images (Max 25MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Select a PDF file to convert
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Each page will be converted to a separate JPG image
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
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded">
                    <FileImage className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
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
                <Progress value={progress} className="w-full h-2" />
                <p className="text-center text-sm text-gray-600">
                  Converting to JPG... {progress}%
                </p>
              </div>
            )}

            {file && !processedFiles.length && !isProcessing && (
              <Button
                onClick={handleConvert}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <FileImage className="h-4 w-4 mr-2" />
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {processedFiles.map((fileData, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Image className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Page {index + 1}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadSingle(fileData)}
                        className="text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleDownloadAll}
                  className="w-full"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All Images ({processedFiles.length} files)
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
