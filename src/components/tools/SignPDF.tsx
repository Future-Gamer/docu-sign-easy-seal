
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, PenTool, ArrowLeft, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SignPDFProps {
  onBack: () => void;
}

const SignPDF = ({ onBack }: SignPDFProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
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

  const handleSign = async () => {
    if (!file || !signerName || !signerEmail) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all fields and select a PDF file',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate signing process
    setTimeout(() => {
      // Create a mock signed PDF
      const signedBlob = new Blob([file], { type: 'application/pdf' });
      setProcessedFile(signedBlob);
      setIsProcessing(false);
      toast({
        title: 'PDF signed successfully',
        description: 'Your signed PDF is ready for download',
      });
    }, 3000);
  };

  const handleDownload = () => {
    if (!processedFile || !file) return;
    
    const url = URL.createObjectURL(processedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signed_${file.name}`;
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
            <PenTool className="h-6 w-6 text-blue-500" />
            <span>Sign PDF</span>
          </CardTitle>
          <CardDescription>
            Sign yourself or request electronic signatures from others
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-100 mb-2">
              Select a PDF file to sign
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
                  <div className="bg-blue-100 p-2 rounded">
                    <PenTool className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{file.name}</p>
                    <p className="text-sm text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Signer Name
                  </label>
                  <Input
                    placeholder="Enter signer name"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Signer Email
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter signer email"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                  />
                </div>
              </div>

              {!processedFile ? (
                <Button
                  onClick={handleSign}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : 'Sign PDF'}
                </Button>
              ) : (
                <Button
                  onClick={handleDownload}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Signed PDF
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SignPDF;
