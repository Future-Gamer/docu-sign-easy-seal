
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, PenTool } from 'lucide-react';
import SignatureCanvas from '../SignatureCanvas';

interface SignatureDetailsModalProps {
  onClose: () => void;
  onSave: (details: SignatureDetails) => void;
  initialDetails?: Partial<SignatureDetails>;
}

export interface SignatureDetails {
  fullName: string;
  initials: string;
  signatureType: 'simple' | 'digital';
  signatureData?: string;
  color: string;
  fontStyle: string;
}

const SignatureDetailsModal: React.FC<SignatureDetailsModalProps> = ({
  onClose,
  onSave,
  initialDetails
}) => {
  const [details, setDetails] = useState<SignatureDetails>({
    fullName: initialDetails?.fullName || '',
    initials: initialDetails?.initials || '',
    signatureType: initialDetails?.signatureType || 'simple',
    signatureData: initialDetails?.signatureData || '',
    color: initialDetails?.color || '#000000',
    fontStyle: initialDetails?.fontStyle || 'cursive',
  });

  const [currentSignature, setCurrentSignature] = useState<string | null>(
    details.signatureData || null
  );

  const signatureStyles = [
    { name: 'Signature', style: 'cursive', example: 'Signature' },
    { name: 'Signature', style: 'script', example: 'Signature' },
    { name: 'Signature', style: 'modern', example: 'Signature' },
    { name: 'Signature', style: 'elegant', example: 'Signature' },
  ];

  const colors = ['#000000', '#FF0000', '#00B4D8', '#00B050'];

  const handleSave = () => {
    if (!details.fullName.trim()) return;
    
    const finalDetails = {
      ...details,
      signatureData: currentSignature || details.signatureData || '',
    };
    
    onSave(finalDetails);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Set your signature details</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">Login</Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name and Initials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Full name: <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Your name"
                value={details.fullName}
                onChange={(e) => setDetails(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Initials:</label>
              <Input
                placeholder="Your initials"
                value={details.initials}
                onChange={(e) => setDetails(prev => ({ ...prev, initials: e.target.value }))}
              />
            </div>
          </div>

          {/* Signature Types */}
          <div className="space-y-4">
            <div className="flex space-x-4 border-b">
              <button
                className={`pb-2 px-1 font-medium ${
                  details.signatureType === 'simple'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600'
                }`}
                onClick={() => setDetails(prev => ({ ...prev, signatureType: 'simple' }))}
              >
                <PenTool className="h-4 w-4 inline mr-1" />
                Signature
              </button>
              <button
                className={`pb-2 px-1 font-medium ${
                  details.signatureType === 'digital'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600'
                }`}
                onClick={() => setDetails(prev => ({ ...prev, signatureType: 'digital' }))}
              >
                AC Initials
              </button>
            </div>

            {details.signatureType === 'simple' && (
              <div className="space-y-4">
                {/* Draw Signature */}
                <div className="border-2 border-gray-200 rounded-lg p-4">
                  <SignatureCanvas 
                    onSignatureChange={setCurrentSignature}
                    width={400}
                    height={150}
                  />
                </div>

                {/* Predefined Styles */}
                <div className="space-y-3">
                  {signatureStyles.map((style, index) => (
                    <label key={index} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="signatureStyle"
                        value={style.style}
                        checked={details.fontStyle === style.style}
                        onChange={(e) => setDetails(prev => ({ ...prev, fontStyle: e.target.value }))}
                        className="text-green-500"
                      />
                      <div className="flex-1 p-3 border rounded text-center">
                        <span style={{ fontFamily: style.style, fontSize: '24px' }}>
                          {details.fullName || 'Signature'}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Color Options */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Color:</label>
                  <div className="flex space-x-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded-full border-2 ${
                          details.color === color ? 'border-gray-400' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setDetails(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave}
              className="bg-red-500 hover:bg-red-600 text-white px-6"
              disabled={!details.fullName.trim()}
            >
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignatureDetailsModal;
