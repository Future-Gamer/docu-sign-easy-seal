
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenTool, Plus, FileText } from 'lucide-react';

interface SignatureField {
  id: string;
  type: 'signature' | 'initials' | 'name' | 'date' | 'text' | 'company_stamp';
  label: string;
  icon: React.ReactNode;
  isRequired?: boolean;
}

interface SignatureFieldSidebarProps {
  onAddField: (fieldType: string) => void;
  requiredFields: SignatureField[];
  optionalFields: SignatureField[];
  onSign: () => void;
  isProcessing?: boolean;
  currentPage?: number;
  totalFields?: number;
  currentPageFields?: number;
}

const SignatureFieldSidebar: React.FC<SignatureFieldSidebarProps> = ({
  onAddField,
  requiredFields,
  optionalFields,
  onSign,
  isProcessing = false,
  currentPage = 1,
  totalFields = 0,
  currentPageFields = 0
}) => {
  const renderField = (field: SignatureField, index: number) => (
    <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
          {field.icon}
        </div>
        <span className="text-sm font-medium">{field.label}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onAddField(field.type)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b flex-shrink-0">
        <h2 className="text-xl font-semibold">Signing options</h2>
        <div className="mt-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Page {currentPage}</span>
          </div>
          <div className="mt-1 text-xs">
            {currentPageFields} field{currentPageFields !== 1 ? 's' : ''} on this page
            {totalFields > 0 && ` • ${totalFields} total`}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="flex flex-col items-center p-4 h-auto border-2 border-red-400 bg-red-50"
              >
                <PenTool className="h-6 w-6 text-red-500 mb-2" />
                <span className="text-xs text-red-600">Simple Signature</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center p-4 h-auto"
              >
                <div className="h-6 w-6 mb-2 text-gray-400">🔒</div>
                <span className="text-xs text-gray-600">Digital Signature</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Required Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Required fields</CardTitle>
            <p className="text-xs text-gray-500">
              Add to page {currentPage}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {requiredFields.map((field, index) => renderField(field, index))}
          </CardContent>
        </Card>

        {/* Optional Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Optional fields</CardTitle>
            <p className="text-xs text-gray-500">
              Add to page {currentPage}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {optionalFields.map((field, index) => renderField(field, index))}
          </CardContent>
        </Card>
      </div>

      {/* Sign Button */}
      <div className="p-4 border-t flex-shrink-0">
        <Button 
          onClick={onSign}
          className="w-full bg-red-500 hover:bg-red-600 text-white h-12 text-lg"
          disabled={isProcessing || totalFields === 0}
        >
          {isProcessing ? 'Processing...' : `Sign ${totalFields > 0 ? `(${totalFields} fields)` : ''} →`}
        </Button>
      </div>
    </div>
  );
};

export default SignatureFieldSidebar;
