
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Droplet, ArrowLeft, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WatermarkPDFProps {
  onBack: () => void;
}

const WatermarkPDF = ({ onBack }: WatermarkPDFProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<Blob | null>(null);
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

  const handleWatermark = async () => {
    if (!file || !watermarkText) {
      toast({
        title: 'Missing information',
        description: 'Please select a PDF file and enter watermark text',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate watermarking process
    setTimeout(() => {
      // Create a mock watermarked PDF
      const watermarkedBlob = new Blob([file], { type: 'application/pdf' });
      setProcessedFile(watermarkedBlob);
      setIsProcessing(false);
      toast({
        title: 'Watermark added successfully',
        description: 'Your watermarked PDF is ready for download',
      });
    }, 3000);
  };

  const handleDownload = () => {
    if (!processedFile || !file) return;
    
    const url = URL.createObjectURL(processedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watermarked_${file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            <Droplet className="h-6 w-6 text-purple-500" />
            <span>Watermark PDF</span>
          </CardTitle>
          <CardDescription>
            Stamp an image or text over your PDF in seconds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-100 mb-2">
              Select a PDF file to watermark
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
            <div className="space-y-6">
              <div className="p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-2 rounded">
                    <Droplet className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{file.name}</p>
                    <p className="text-sm text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Watermark Text
                </label>
                <Input
                  placeholder="Enter watermark text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                />
              </div>

              {!processedFile ? (
                <Button
                  onClick={handleWatermark}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Adding Watermark...' : 'Add Watermark'}
                </Button>
              ) : (
                <Button
                  onClick={handleDownload}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Watermarked PDF
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WatermarkPDF;
