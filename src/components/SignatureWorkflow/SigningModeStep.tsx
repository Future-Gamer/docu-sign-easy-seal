
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Users } from 'lucide-react';

interface SigningModeStepProps {
  documentName: string;
  onSelectMode: (mode: 'self' | 'multiple') => void;
}

const SigningModeStep: React.FC<SigningModeStepProps> = ({
  documentName,
  onSelectMode
}) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl mx-4">
        <CardContent className="p-8">
          <h2 className="text-2xl font-semibold text-center mb-8">
            Who will sign this document?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div 
              className="text-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-400 cursor-pointer transition-colors"
              onClick={() => onSelectMode('self')}
            >
              <div className="mb-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
              </div>
              <Button className="w-full bg-red-500 hover:bg-red-600 text-white mb-3">
                Only me
              </Button>
              <p className="text-sm text-gray-600">Sign this document yourself</p>
            </div>

            <div 
              className="text-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-400 cursor-pointer transition-colors"
              onClick={() => onSelectMode('multiple')}
            >
              <div className="mb-4">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-orange-600" />
                </div>
              </div>
              <Button className="w-full bg-red-500 hover:bg-red-600 text-white mb-3">
                Several people
              </Button>
              <p className="text-sm text-gray-600">Invite others to sign</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Document: <span className="font-medium">{documentName}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SigningModeStep;
