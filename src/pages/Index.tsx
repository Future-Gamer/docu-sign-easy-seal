
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import LandingPage from '@/components/LandingPage';
import Dashboard from '@/components/Dashboard';
import PDFTools from '@/components/PDFTools';
import MergePDF from '@/components/tools/MergePDF';
import SplitPDF from '@/components/tools/SplitPDF';
import CompressPDF from '@/components/tools/CompressPDF';
import PDFToJPG from '@/components/tools/PDFToJPG';
import WordToPDF from '@/components/tools/WordToPDF';
import SignPDF from '@/components/tools/SignPDF';
import WatermarkPDF from '@/components/tools/WatermarkPDF';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'tools'>('dashboard');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const handleGetStarted = () => {
    setShowAuthModal(true);
  };

  const handleToolSelect = (tool: string) => {
    console.log('Selected tool:', tool);
    setSelectedTool(tool);
  };

  const handleBackToTools = () => {
    setSelectedTool(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const renderToolComponent = () => {
    switch (selectedTool) {
      case 'merge':
        return <MergePDF onBack={handleBackToTools} />;
      case 'split':
        return <SplitPDF onBack={handleBackToTools} />;
      case 'compress':
        return <CompressPDF onBack={handleBackToTools} />;
      case 'pdf-to-jpg':
        return <PDFToJPG onBack={handleBackToTools} />;
      case 'word-to-pdf':
        return <WordToPDF onBack={handleBackToTools} />;
      case 'sign-pdf':
        return <SignPDF onBack={handleBackToTools} />;
      case 'watermark':
        return <WatermarkPDF onBack={handleBackToTools} />;
      default:
        return (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">
              {selectedTool?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Tool
            </h2>
            <p className="text-gray-400 mb-6">
              This tool is coming soon! We're working hard to implement all PDF features.
            </p>
            <button
              onClick={handleBackToTools}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Tools
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar 
        user={user} 
        onSignOut={signOut}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      {user ? (
        <>
          {currentView === 'dashboard' ? (
            <Dashboard user={user} />
          ) : selectedTool ? (
            renderToolComponent()
          ) : (
            <PDFTools onToolSelect={handleToolSelect} />
          )}
        </>
      ) : (
        <LandingPage onGetStarted={handleGetStarted} />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default Index;
