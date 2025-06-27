
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Upload, Droplet, ArrowLeft, Download, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PDFProcessor } from '@/services/pdfProcessor';

interface WatermarkPDFProps {
  onBack: () => void;
}

const WatermarkPDF = ({ onBack }: WatermarkPDFProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState([30]);
  const [fontSize, setFontSize] = useState([50]);
  const [rotation, setRotation] = useState('-45');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<Blob | null>(null);
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
      setProcessedFile(null);
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please select a PDF file',
        variant: 'destructive',
      });
    }
  };

  const handleWatermark = async () => {
    if (!file || !watermarkText.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please select a PDF file and enter watermark text',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const watermarkedBytes = await PDFProcessor.addWatermarkToPDF(arrayBuffer, watermarkText, {
        opacity: opacity[0] / 100,
        fontSize: fontSize[0],
        rotation: parseInt(rotation),
        color: { r: 0.7, g: 0.7, b: 0.7 }
      });

      const watermarkedBlob = new Blob([watermarkedBytes], { type: 'application/pdf' });
      setProcessedFile(watermarkedBlob);
      setIsProcessing(false);
      
      toast({
        title: 'Watermark added successfully',
        description: 'Your watermarked PDF is ready for download',
      });
    } catch (error) {
      console.error('Watermark error:', error);
      setIsProcessing(false);
      toast({
        title: 'Watermark failed',
        description: 'Failed to add watermark. Please try again.',
        variant: 'destructive',
      });
    }
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

    toast({
      title: 'Download started',
      description: 'Your watermarked PDF is being downloaded',
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

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Droplet className="h-6 w-6 text-purple-500" />
            <span>Watermark PDF</span>
          </CardTitle>
          <CardDescription>
            Add text watermarks to your PDF documents (Max 25MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
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
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-2 rounded">
                    <Droplet className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Watermark Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="watermark-text" className="text-sm font-medium text-gray-700">
                      Watermark Text
                    </Label>
                    <Input
                      id="watermark-text"
                      placeholder="Enter watermark text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Rotation
                    </Label>
                    <Select value={rotation} onValueChange={setRotation}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-45">-45°</SelectItem>
                        <SelectItem value="0">0°</SelectItem>
                        <SelectItem value="45">45°</SelectItem>
                        <SelectItem value="90">90°</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Opacity: {opacity[0]}%
                    </Label>
                    <Slider
                      value={opacity}
                      onValueChange={setOpacity}
                      max={100}
                      min={10}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Font Size: {fontSize[0]}px
                    </Label>
                    <Slider
                      value={fontSize}
                      onValueChange={setFontSize}
                      max={100}
                      min={20}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {!processedFile ? (
                <Button
                  onClick={handleWatermark}
                  disabled={isProcessing}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding Watermark...
                    </>
                  ) : (
                    <>
                      <Droplet className="h-4 w-4 mr-2" />
                      Add Watermark
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="font-medium text-green-800">
                      Watermark Added Successfully!
                    </p>
                    <p className="text-sm text-green-600">
                      Your PDF is ready for download
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleDownload}
                    className="w-full"
                    size="lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Watermarked PDF
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

export default WatermarkPDF;
