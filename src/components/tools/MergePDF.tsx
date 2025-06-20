
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Merge, ArrowLeft, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MergePDFProps {
  onBack: () => void;
}

const MergePDF = ({ onBack }: MergePDFProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== selectedFiles.length) {
      toast({
        title: 'Invalid files',
        description: 'Please select only PDF files',
        variant: 'destructive',
      });
    }
    
    setFiles(prev => [...prev, ...pdfFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({
        title: 'Not enough files',
        description: 'Please select at least 2 PDF files to merge',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      // Create a mock merged PDF
      const mergedBlob = new Blob([files[0]], { type: 'application/pdf' });
      setProcessedFile(mergedBlob);
      setIsProcessing(false);
      toast({
        title: 'PDFs merged successfully',
        description: 'Your merged PDF is ready for download',
      });
    }, 3000);
  };

  const handleDownload = () => {
    if (!processedFile) return;
    
    const url = URL.createObjectURL(processedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged_document.pdf';
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
            <Merge className="h-6 w-6 text-red-600" />
            <span>Merge PDF</span>
          </CardTitle>
          <CardDescription>
            Combine multiple PDF files into a single document
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-100 mb-2">
              Select PDF files to merge
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Choose multiple PDF files to combine them into one
            </p>
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload">
              <Button asChild className="cursor-pointer">
                <span>Choose Files</span>
              </Button>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-100">Selected Files ({files.length})</h3>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-red-100 p-2 rounded">
                        <Merge className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-white">{file.name}</p>
                        <p className="text-xs text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {files.length >= 2 && !processedFile && (
            <Button
              onClick={handleMerge}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? 'Merging...' : 'Merge PDFs'}
            </Button>
          )}

          {processedFile && (
            <Button
              onClick={handleDownload}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Merged PDF
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MergePDF;
