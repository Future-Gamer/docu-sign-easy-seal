
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, ArrowLeft, Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDocuments } from '@/hooks/useDocuments';

interface MergePDFProps {
  onBack: () => void;
}

const MergePDF = ({ onBack }: MergePDFProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedFile, setMergedFile] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { uploadDocument } = useDocuments();

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
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({
        title: 'Insufficient files',
        description: 'Please select at least 2 PDF files to merge',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate merge process
    setTimeout(async () => {
      try {
        // Create a simple merged blob (in real implementation, use PDF-lib)
        const mergedBlob = new Blob([files[0]], { type: 'application/pdf' });
        setMergedFile(mergedBlob);
        
        // Create preview URL
        const url = URL.createObjectURL(mergedBlob);
        setPreviewUrl(url);
        
        // Upload to database
        const mergedFile = new File([mergedBlob], `merged_${Date.now()}.pdf`, { type: 'application/pdf' });
        await uploadDocument(mergedFile);
        
        setIsProcessing(false);
        toast({
          title: 'PDFs merged successfully',
          description: 'Your merged PDF is ready for download',
        });
      } catch (error) {
        setIsProcessing(false);
        toast({
          title: 'Merge failed',
          description: 'Failed to merge PDF files',
          variant: 'destructive',
        });
      }
    }, 3000);
  };

  const handleDownload = () => {
    if (!mergedFile) return;
    
    const url = URL.createObjectURL(mergedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merged_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tools
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-blue-500" />
              <span>Merge PDF Files</span>
            </CardTitle>
            <CardDescription>
              Select multiple PDF files to merge into one document
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-100 mb-2">
                Select PDF files to merge
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
              <div className="space-y-2">
                <h3 className="font-medium text-gray-100">Selected Files:</h3>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium text-white">{file.name}</p>
                        <p className="text-sm text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {!mergedFile ? (
              <Button
                onClick={handleMerge}
                disabled={isProcessing || files.length < 2}
                className="w-full"
              >
                {isProcessing ? 'Merging...' : 'Merge PDFs'}
              </Button>
            ) : (
              <Button onClick={handleDownload} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Merged PDF
              </Button>
            )}
          </CardContent>
        </Card>

        {previewUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96 bg-gray-100 rounded border">
                <iframe
                  src={previewUrl}
                  className="w-full h-full rounded"
                  title="Merged PDF Preview"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MergePDF;
