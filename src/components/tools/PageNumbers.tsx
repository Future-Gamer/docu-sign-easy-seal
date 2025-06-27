
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, Hash, ArrowLeft, Download, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PDFProcessor } from '@/services/pdfProcessor';

interface PageNumbersProps {
  onBack: () => void;
}

const PageNumbers = ({ onBack }: PageNumbersProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left'>('bottom-center');
  const [fontSize, setFontSize] = useState(12);
  const [startPage, setStartPage] = useState(1);
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

  const handleAddPageNumbers = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a PDF file',
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
      const numberedPdfBytes = await PDFProcessor.addPageNumbers(arrayBuffer, {
        position,
        fontSize,
        startPage
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      const blob = new Blob([numberedPdfBytes], { type: 'application/pdf' });
      setProcessedFile(blob);
      setIsProcessing(false);
      
      toast({
        title: 'Page numbers added successfully',
        description: 'Your PDF now has page numbers',
      });
    } catch (error) {
      console.error('Page numbering error:', error);
      setIsProcessing(false);
      setProgress(0);
      toast({
        title: 'Page numbering failed',
        description: 'Failed to add page numbers. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    if (!processedFile || !file) return;
    
    const url = URL.createObjectURL(processedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `numbered_${file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download started',
      description: 'Your numbered PDF is being downloaded',
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
              <Hash className="h-6 w-6 text-purple-600" />
              <span>Add Page Numbers</span>
            </CardTitle>
            <CardDescription>
              Add page numbers to your PDF document (Max 25MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Select a PDF file
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Add customizable page numbers to your document
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
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded">
                      <Hash className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
                  <h3 className="font-medium text-gray-900">Page Number Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="position">Position</Label>
                      <Select value={position} onValueChange={(value: any) => setPosition(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bottom-center">Bottom Center</SelectItem>
                          <SelectItem value="bottom-right">Bottom Right</SelectItem>
                          <SelectItem value="bottom-left">Bottom Left</SelectItem>
                          <SelectItem value="top-center">Top Center</SelectItem>
                          <SelectItem value="top-right">Top Right</SelectItem>
                          <SelectItem value="top-left">Top Left</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fontSize">Font Size</Label>
                      <Input
                        id="fontSize"
                        type="number"
                        min="8"
                        max="24"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startPage">Start From</Label>
                      <Input
                        id="startPage"
                        type="number"
                        min="1"
                        value={startPage}
                        onChange={(e) => setStartPage(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="space-y-4">
                <Progress value={progress} className="w-full h-2" />
                <p className="text-center text-sm text-gray-600">
                  Adding page numbers... {progress}%
                </p>
              </div>
            )}

            {file && !processedFile && !isProcessing && (
              <Button
                onClick={handleAddPageNumbers}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                <Hash className="h-4 w-4 mr-2" />
                Add Page Numbers
              </Button>
            )}

            {processedFile && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-green-800">
                    Page Numbers Added Successfully!
                  </p>
                  <p className="text-sm text-green-600">
                    Your PDF now has page numbers in {position.replace('-', ' ')} position
                  </p>
                </div>

                <Button onClick={handleDownload} className="w-full" size="lg">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF with Page Numbers
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PageNumbers;
