
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, ArrowLeft, Download, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useDocuments } from '@/hooks/useDocuments';
import { PDFDocument } from 'pdf-lib';

interface MergePDFProps {
  onBack: () => void;
}

const MergePDF = ({ onBack }: MergePDFProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedFile, setMergedFile] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const { toast } = useToast();
  const { uploadDocument } = useDocuments();

  const validateFileSize = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return file.size <= maxSize;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== selectedFiles.length) {
      toast({
        title: 'Invalid files',
        description: 'Please select only PDF files',
        variant: 'destructive',
      });
      return;
    }

    const oversizedFiles = pdfFiles.filter(file => !validateFileSize(file));
    if (oversizedFiles.length > 0) {
      toast({
        title: 'File size exceeded',
        description: `Files must be smaller than 10MB. ${oversizedFiles.length} file(s) exceed this limit.`,
        variant: 'destructive',
      });
      return;
    }
    
    setFiles(prev => [...prev, ...pdfFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const actuallyMergePDFs = async (pdfFiles: File[]): Promise<Uint8Array> => {
    const mergedPdf = await PDFDocument.create();

    for (const file of pdfFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    return await mergedPdf.save();
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
    setProgress(0);
    
    try {
      // Update progress
      setProgress(25);
      
      // Actually merge the PDFs using PDF-lib
      const mergedPdfBytes = await actuallyMergePDFs(files);
      setProgress(75);
      
      // Create blob from merged PDF
      const mergedBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      setMergedFile(mergedBlob);
      
      // Create preview URL
      const url = URL.createObjectURL(mergedBlob);
      setPreviewUrl(url);
      setProgress(90);
      
      // Upload to database
      const mergedFileName = new File([mergedBlob], `merged_${Date.now()}.pdf`, { type: 'application/pdf' });
      await uploadDocument(mergedFileName);
      
      setProgress(100);
      setIsProcessing(false);
      setIsCompleted(true);
      
      toast({
        title: 'PDFs merged successfully',
        description: 'Your merged PDF is ready for download and has been saved to your documents',
      });
    } catch (error) {
      console.error('Error merging PDFs:', error);
      setIsProcessing(false);
      toast({
        title: 'Merge failed',
        description: 'Failed to merge PDF files. Please try again.',
        variant: 'destructive',
      });
    }
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

  const resetProcess = () => {
    setFiles([]);
    setMergedFile(null);
    setPreviewUrl(null);
    setProgress(0);
    setIsCompleted(false);
    setIsProcessing(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white min-h-screen">
      <div className="mb-6">
        <Button variant="outline" onClick={onBack} className="mb-4 border-gray-300 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tools
        </Button>
      </div>

      <div className="space-y-6">
        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <FileText className="h-6 w-6 text-blue-500" />
              <span>Step 1: Select PDF Files to Merge</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Select multiple PDF files to merge into one document (Max 10MB per file)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Select PDF files to merge
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Choose at least 2 PDF files (Max 10MB each)
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
                <Button asChild className="cursor-pointer bg-blue-500 hover:bg-blue-600">
                  <span>Choose Files</span>
                </Button>
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-gray-800">Selected Files:</h3>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-800">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {files.length >= 2 && (
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-800">Step 2: Merge Process</CardTitle>
              <CardDescription className="text-gray-600">
                Start the merging process for your selected PDF files
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isProcessing && !isCompleted && (
                <Button
                  onClick={handleMerge}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  Merge {files.length} PDF Files
                </Button>
              )}

              {isProcessing && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-800 mb-2">Merging PDFs...</p>
                    <p className="text-sm text-gray-600 mb-4">Processing {files.length} files</p>
                  </div>
                  <Progress value={progress} className="w-full h-3" />
                  <p className="text-center text-sm text-gray-600">
                    {progress}% complete
                  </p>
                </div>
              )}

              {isCompleted && (
                <div className="space-y-4">
                  <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-green-600 mb-2">
                      <FileText className="h-12 w-12 mx-auto" />
                    </div>
                    <p className="text-lg font-medium text-green-800 mb-2">
                      Merge Completed Successfully!
                    </p>
                    <p className="text-sm text-green-600">
                      Your {files.length} PDF files have been merged into one document
                    </p>
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button
                      onClick={handleDownload}
                      className="flex-1 bg-blue-500 hover:bg-blue-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Merged PDF
                    </Button>
                    <Button
                      onClick={resetProcess}
                      variant="outline"
                      className="flex-1 border-gray-300 hover:bg-gray-50"
                    >
                      Start New Merge
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {previewUrl && (
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-800">Step 3: Preview Merged PDF</CardTitle>
              <CardDescription className="text-gray-600">
                Preview of your merged PDF document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden" style={{ height: '600px' }}>
                <iframe
                  src={previewUrl}
                  className="w-full h-full"
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
