
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Scissors, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SplitPDFProps {
  onBack: () => void;
}

const SplitPDF = ({ onBack }: SplitPDFProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [splitType, setSplitType] = useState<'pages' | 'range'>('pages');
  const [pageRanges, setPageRanges] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
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
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: 'PDF split successfully',
        description: 'Your split PDF files are ready for download',
      });
    }, 3000);
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
            <Scissors className="h-6 w-6 text-orange-600" />
            <span>Split PDF</span>
          </CardTitle>
          <CardDescription>
            Extract pages from your PDF document
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Select a PDF file to split
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
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-2 rounded">
                    <Scissors className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Split by page ranges (e.g., 1-3, 5-7, 10)
                  </label>
                  <Input
                    placeholder="Enter page ranges: 1-3, 5-7, 10"
                    value={pageRanges}
                    onChange={(e) => setPageRanges(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use commas to separate ranges. Example: 1-3, 5-7, 10
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSplit}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Splitting...' : 'Split PDF'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SplitPDF;
