import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileDown, ArrowLeft, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDocuments } from '@/hooks/useDocuments';

interface WordToPDFProps {
  onBack: () => void;
}

const WordToPDF = ({ onBack }: WordToPDFProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<Blob | null>(null);
  const { toast } = useToast();
  const { documents } = useDocuments();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || selectedFile.type === 'application/msword')) {
      setFile(selectedFile);
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please select a Word document (.doc or .docx)',
        variant: 'destructive',
      });
    }
  };

  const handleConvert = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a Word document to convert',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate conversion process
    setTimeout(() => {
      // Create a mock PDF file
      const pdfBlob = new Blob(['mock PDF content'], { type: 'application/pdf' });
      setProcessedFile(pdfBlob);
      setIsProcessing(false);
      toast({
        title: 'Document converted successfully',
        description: 'Your PDF is ready for download',
      });
    }, 3000);
  };

  const handleDownload = () => {
    if (!processedFile || !file) return;
    
    const url = URL.createObjectURL(processedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace(/\.(doc|docx)$/, '')}.pdf`;
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
            <FileDown className="h-6 w-6 text-indigo-600" />
            <span>Word to PDF</span>
          </CardTitle>
          <CardDescription>
            Convert Word documents to PDF
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-100 mb-2">
              Select a Word document to convert
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Supports .doc and .docx files
            </p>
            <input
              type="file"
              accept=".doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              id="word-upload"
            />
            <label htmlFor="word-upload">
              <Button asChild className="cursor-pointer">
                <span>Choose File</span>
              </Button>
            </label>
          </div>

          {file && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-100 p-2 rounded">
                    <FileDown className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{file.name}</p>
                    <p className="text-sm text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>

              {!processedFile ? (
                <Button
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Converting...' : 'Convert to PDF'}
                </Button>
              ) : (
                <Button
                  onClick={handleDownload}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WordToPDF;
