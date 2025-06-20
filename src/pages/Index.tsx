
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import LandingPage from '@/components/LandingPage';
import Dashboard from '@/components/Dashboard';
import PDFTools from '@/components/PDFTools';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'tools'>('dashboard');

  const handleGetStarted = () => {
    setShowAuthModal(true);
  };

  const handleToolSelect = (tool: string) => {
    console.log('Selected tool:', tool);
    // This will be implemented in future iterations
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        user={user} 
        onSignOut={signOut}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      {user ? (
        currentView === 'dashboard' ? (
          <Dashboard user={user} />
        ) : (
          <PDFTools onToolSelect={handleToolSelect} />
        )
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
