
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle } from 'lucide-react';

interface CompletionStepProps {
  onDownload: () => void;
  onSignAnother: () => void;
}

const CompletionStep: React.FC<CompletionStepProps> = ({
  onDownload,
  onSignAnother
}) => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-4">Document Signed Successfully!</h2>
        <p className="text-gray-600 mb-8">Your PDF has been digitally signed and is ready for download</p>
        
        <div className="space-y-4">
          <Button
            onClick={onDownload}
            className="bg-blue-500 hover:bg-blue-600 px-8"
            size="lg"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Signed PDF
          </Button>
          
          <div>
            <Button onClick={onSignAnother} variant="outline">
              Sign Another Document
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionStep;
