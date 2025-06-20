
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import LandingPage from '@/components/LandingPage';
import Dashboard from '@/components/Dashboard';
import AuthModal from '@/components/AuthModal';
import { useToast } from '@/hooks/use-toast';

interface User {
  name: string;
  email: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { toast } = useToast();

  const handleLogin = (email: string, password: string) => {
    // Mock login - in real app, this would call your API
    console.log('Login attempt:', { email, password });
    
    // Simulate successful login
    setUser({
      name: email === 'demo@example.com' ? 'Demo User' : 'John Doe',
      email: email
    });
    
    setShowAuthModal(false);
    toast({
      title: 'Welcome back!',
      description: 'You have successfully signed in.',
    });
  };

  const handleRegister = (name: string, email: string, password: string) => {
    // Mock registration - in real app, this would call your API
    console.log('Registration attempt:', { name, email, password });
    
    // Simulate successful registration
    setUser({ name, email });
    setShowAuthModal(false);
    toast({
      title: 'Account created!',
      description: 'Welcome to DocuSign Pro. You can now start uploading documents.',
    });
  };

  const handleSignOut = () => {
    setUser(null);
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
  };

  const handleGetStarted = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onSignOut={handleSignOut} />
      
      {user ? (
        <Dashboard user={user} />
      ) : (
        <LandingPage onGetStarted={handleGetStarted} />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </div>
  );
};

export default Index;
