
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Scissors, ArrowLeft, Download, CheckCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PDFProcessor } from '@/services/pdfProcessor';

interface SplitPDFProps {
  onBack: () => void;
}

const SplitPDF = ({ onBack }: SplitPDFProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<{ blob: Blob; name: string }[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
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
      // Reset previous results
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

  const handleSplit = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a PDF file to split',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simulate splitting process with progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 200);

      // Split PDF into individual pages
      const arrayBuffer = await file.arrayBuffer();
      const splitFiles = await PDFProcessor.splitPDF(arrayBuffer);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      const processedFilesData = splitFiles.map((pdfBytes, index) => ({
        blob: new Blob([pdfBytes], { type: 'application/pdf' }),
        name: `${file.name.replace('.pdf', '')}_page_${index + 1}.pdf`
      }));

      setProcessedFiles(processedFilesData);
      setTotalPages(splitFiles.length);
      setIsProcessing(false);
      
      toast({
        title: 'PDF split successfully',
        description: `Split into ${splitFiles.length} individual pages`,
      });
    } catch (error) {
      console.error('Split error:', error);
      setIsProcessing(false);
      setProgress(0);
      toast({
        title: 'Split failed',
        description: 'Failed to split PDF. Please try again.',
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
      description: `Downloading ${processedFiles.length} PDF files`,
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
              <Scissors className="h-6 w-6 text-orange-600" />
              <span>Split PDF</span>
            </CardTitle>
            <CardDescription>
              Extract individual pages from your PDF (Max 25MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Select a PDF file to split
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Each page will be saved as a separate PDF file
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

            {/* Selected File Display */}
            {file && (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-2 rounded">
                    <Scissors className="h-4 w-4 text-orange-600" />
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

            {/* Progress Display */}
            {isProcessing && (
              <div className="space-y-4">
                <Progress value={progress} className="w-full h-2" />
                <p className="text-center text-sm text-gray-600">
                  Splitting PDF... {progress}%
                </p>
              </div>
            )}

            {/* Split Button */}
            {file && !processedFiles.length && !isProcessing && (
              <Button
                onClick={handleSplit}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                <Scissors className="h-4 w-4 mr-2" />
                Split PDF
              </Button>
            )}

            {/* Results Display */}
            {processedFiles.length > 0 && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-green-800">
                    Split Complete!
                  </p>
                  <p className="text-sm text-green-600">
                    {processedFiles.length} pages ready for download
                  </p>
                </div>
                
                {/* Individual File Downloads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {processedFiles.map((fileData, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-500" />
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

                {/* Download All Button */}
                <Button
                  onClick={handleDownloadAll}
                  className="w-full"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All Pages ({processedFiles.length} files)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SplitPDF;
