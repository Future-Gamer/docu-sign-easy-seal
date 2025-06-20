
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileImage, ArrowLeft, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PDFToJPGProps {
  onBack: () => void;
}

const PDFToJPG = ({ onBack }: PDFToJPGProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<Blob[]>([]);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
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
    
    // Simulate conversion process
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tools
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileImage className="h-6 w-6 text-green-600" />
            <span>PDF to JPG</span>
          </CardTitle>
          <CardDescription>
            Convert PDF pages to JPG images
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-100 mb-2">
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
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded">
                    <FileImage className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{file.name}</p>
                    <p className="text-sm text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>

              {processedFiles.length === 0 ? (
                <Button
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Converting...' : 'Convert to JPG'}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <p className="text-white mb-2">Conversion Complete!</p>
                    <p className="text-sm text-gray-400">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFToJPG;
