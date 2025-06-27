
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, RotateCw, ArrowLeft, Download, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PDFProcessor } from '@/services/pdfProcessor';

interface RotatePDFProps {
  onBack: () => void;
}

const RotatePDF = ({ onBack }: RotatePDFProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [rotation, setRotation] = useState<90 | 180 | 270>(90);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      if (selectedFile.size > 25 * 1024 * 1024) {
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
      setProcessedFile(null);
      setProgress(0);
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please select a PDF file',
        variant: 'destructive',
      });
    }
  };

  const handleRotate = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a PDF file to rotate',
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
          return prev + 20;
        });
      }, 200);

      const arrayBuffer = await file.arrayBuffer();
      const rotatedPdfBytes = await PDFProcessor.rotatePDF(arrayBuffer, rotation);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      const blob = new Blob([rotatedPdfBytes], { type: 'application/pdf' });
      setProcessedFile(blob);
      setIsProcessing(false);
      
      toast({
        title: 'PDF rotated successfully',
        description: `All pages rotated ${rotation}° clockwise`,
      });
    } catch (error) {
      console.error('Rotation error:', error);
      setIsProcessing(false);
      setProgress(0);
      toast({
        title: 'Rotation failed',
        description: 'Failed to rotate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    if (!processedFile || !file) return;
    
    const url = URL.createObjectURL(processedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rotated_${rotation}deg_${file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download started',
      description: 'Your rotated PDF is being downloaded',
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
              <RotateCw className="h-6 w-6 text-blue-600" />
              <span>Rotate PDF</span>
            </CardTitle>
            <CardDescription>
              Rotate all pages of your PDF document (Max 25MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Select a PDF file to rotate
              </p>
              <p className="text-sm text-gray-500 mb-4">
                All pages will be rotated by the selected angle
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
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded">
                      <RotateCw className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h3 className="font-medium text-gray-900 mb-3">Select Rotation</h3>
                  <div className="flex space-x-3">
                    {[90, 180, 270].map((angle) => (
                      <Button
                        key={angle}
                        variant={rotation === angle ? 'default' : 'outline'}
                        onClick={() => setRotation(angle as 90 | 180 | 270)}
                        className="flex-1"
                      >
                        <RotateCw className="h-4 w-4 mr-2" />
                        {angle}°
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="space-y-4">
                <Progress value={progress} className="w-full h-2" />
                <p className="text-center text-sm text-gray-600">
                  Rotating PDF pages... {progress}%
                </p>
              </div>
            )}

            {file && !processedFile && !isProcessing && (
              <Button
                onClick={handleRotate}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Rotate PDF ({rotation}°)
              </Button>
            )}

            {processedFile && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-green-800">
                    PDF Rotated Successfully!
                  </p>
                  <p className="text-sm text-green-600">
                    All pages rotated {rotation}° clockwise
                  </p>
                </div>

                <Button onClick={handleDownload} className="w-full" size="lg">
                  <Download className="h-4 w-4 mr-2" />
                  Download Rotated PDF
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RotatePDF;
