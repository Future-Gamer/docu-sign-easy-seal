
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, Shield, ArrowLeft, Download, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PDFProcessor } from '@/services/pdfProcessor';

interface ProtectPDFProps {
  onBack: () => void;
}

const ProtectPDF = ({ onBack }: ProtectPDFProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleProtect = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a PDF file to protect',
        variant: 'destructive',
      });
      return;
    }

    if (!password) {
      toast({
        title: 'Password required',
        description: 'Please enter a password to protect the PDF',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both password fields match',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long',
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
      const protectedPdfBytes = await PDFProcessor.protectPDF(arrayBuffer, password);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      const blob = new Blob([protectedPdfBytes], { type: 'application/pdf' });
      setProcessedFile(blob);
      setIsProcessing(false);
      
      toast({
        title: 'PDF protected successfully',
        description: 'Your PDF is now password protected',
      });
    } catch (error) {
      console.error('Protection error:', error);
      setIsProcessing(false);
      setProgress(0);
      toast({
        title: 'Protection failed',
        description: 'Failed to protect PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    if (!processedFile || !file) return;
    
    const url = URL.createObjectURL(processedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protected_${file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download started',
      description: 'Your protected PDF is being downloaded',
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
              <Shield className="h-6 w-6 text-red-600" />
              <span>Protect PDF</span>
            </CardTitle>
            <CardDescription>
              Add password protection to your PDF document (Max 25MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Select a PDF file to protect
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Add password protection to prevent unauthorized access
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
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-100 p-2 rounded">
                      <Shield className="h-4 w-4 text-red-600" />
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
                  <h3 className="font-medium text-gray-900">Set Password Protection</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password (minimum 6 characters)</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                    />
                  </div>

                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-sm text-red-600">Passwords do not match</p>
                  )}
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="space-y-4">
                <Progress value={progress} className="w-full h-2" />
                <p className="text-center text-sm text-gray-600">
                  Adding password protection... {progress}%
                </p>
              </div>
            )}

            {file && !processedFile && !isProcessing && (
              <Button
                onClick={handleProtect}
                className="w-full bg-red-600 hover:bg-red-700"
                size="lg"
                disabled={!password || !confirmPassword || password !== confirmPassword}
              >
                <Shield className="h-4 w-4 mr-2" />
                Protect PDF with Password
              </Button>
            )}

            {processedFile && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-green-800">
                    PDF Protected Successfully!
                  </p>
                  <p className="text-sm text-green-600">
                    Your PDF is now password protected
                  </p>
                </div>

                <Button onClick={handleDownload} className="w-full" size="lg">
                  <Download className="h-4 w-4 mr-2" />
                  Download Protected PDF
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProtectPDF;
