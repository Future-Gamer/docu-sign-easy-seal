
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Shield, User } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const features = [
    {
      icon: <FileText className="h-8 w-8 text-blue-600" />,
      title: 'Upload & Manage',
      description: 'Easily upload PDF documents and manage all your signature requests in one place.'
    },
    {
      icon: <User className="h-8 w-8 text-blue-600" />,
      title: 'Send for Signature',
      description: 'Send documents to multiple signers with secure, trackable signature links.'
    },
    {
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      title: 'Secure & Legal',
      description: 'Bank-level security with complete audit trails for legal compliance.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Sign Documents
            <span className="block text-blue-600">Anywhere, Anytime</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your document signing process with our secure, professional platform. 
            Upload, sign, and manage contracts with ease.
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="px-8 py-3 text-lg"
            >
              Get Started Free
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-3 text-lg"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything you need to manage signatures
          </h2>
          <p className="text-lg text-gray-600">
            Powerful features designed for modern businesses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to streamline your document workflow?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses who trust DocuSign Pro for their document signing needs.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={onGetStarted}
            className="px-8 py-3 text-lg"
          >
            Start Signing Today
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
