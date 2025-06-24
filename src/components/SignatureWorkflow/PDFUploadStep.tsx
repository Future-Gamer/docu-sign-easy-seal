
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';

interface PDFUploadStepProps {
  onFileUpload: (file: File) => void;
}

const PDFUploadStep: React.FC<PDFUploadStepProps> = ({ onFileUpload }) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <FileText className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Select PDF to Sign</h2>
          <p className="text-gray-600">Choose a PDF file to add your digital signature</p>
        </div>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            id="pdf-upload"
          />
          <label htmlFor="pdf-upload">
            <Button asChild className="cursor-pointer bg-blue-500 hover:bg-blue-600">
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Choose PDF File
              </span>
            </Button>
          </label>
          <p className="text-sm text-gray-500 mt-2">Maximum file size: 25MB</p>
        </div>
      </div>
    </div>
  );
};

export default PDFUploadStep;
