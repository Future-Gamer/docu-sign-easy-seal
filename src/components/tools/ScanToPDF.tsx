
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Scan, ArrowLeft, Download, CheckCircle, Image, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PDFProcessor } from '@/services/pdfProcessor';

interface ScanToPDFProps {
  onBack: () => void;
}

const ScanToPDF = ({ onBack }: ScanToPDFProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB per image
    );

    if (validFiles.length !== selectedFiles.length) {
      toast({
        title: 'Some files were skipped',
        description: 'Only image files under 10MB are supported',
        variant: 'destructive',
      });
    }

    setFiles(prev => [...prev, ...validFiles]);
    setProcessedFile(null);
    setProgress(0);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePDF = async () => {
    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one image file',
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
          return prev + 10;
        });
      }, 300);

      const pdfBytes = await PDFProcessor.createPDFFromImages(files);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setProcessedFile(blob);
      setIsProcessing(false);
      
      toast({
        title: 'PDF created successfully',
        description: `Created PDF from ${files.length} images`,
      });
    } catch (error) {
      console.error('PDF creation error:', error);
      setIsProcessing(false);
      setProgress(0);
      toast({
        title: 'PDF creation failed',
        description: 'Failed to create PDF from images. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    if (!processedFile) return;
    
    const url = URL.createObjectURL(processedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scanned_document_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download started',
      description: 'Your PDF is being downloaded',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white min-h-screen">
      <div className="mb-6">
        <Button variant="outline" onClick={onBack} className="mb-4 border-gray-300">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tools
        </Button>
      </div>

      <div className="space-y-6">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Scan className="h-6 w-6 text-indigo-600" />
              <span>Scan to PDF</span>
            </CardTitle>
            <CardDescription>
              Convert images to PDF document (Max 10MB per image)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Select image files to convert
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Upload scanned images, photos, or documents (JPG, PNG, etc.)
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
                multiple
              />
              <label htmlFor="image-upload">
                <Button asChild className="cursor-pointer">
                  <span>Choose Images</span>
                </Button>
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <h3 className="font-medium text-indigo-900 mb-3">
                    Selected Images ({files.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {files.map((file, index) => (
                      <div key={index} className="relative p-3 bg-white rounded border">
                        <div className="flex items-start space-x-2">
                          <Image className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="space-y-4">
                <Progress value={progress} className="w-full h-2" />
                <p className="text-center text-sm text-gray-600">
                  Creating PDF from images... {progress}%
                </p>
              </div>
            )}

            {files.length > 0 && !processedFile && !isProcessing && (
              <Button
                onClick={handleCreatePDF}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                <Scan className="h-4 w-4 mr-2" />
                Create PDF ({files.length} images)
              </Button>
            )}

            {processedFile && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-green-800">
                    PDF Created Successfully!
                  </p>
                  <p className="text-sm text-green-600">
                    {files.length} images converted to PDF
                  </p>
                </div>

                <Button onClick={handleDownload} className="w-full" size="lg">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScanToPDF;
