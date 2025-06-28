
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, User } from 'lucide-react';

interface NavbarProps {
  user?: { id: string; email?: string } | null;
  onSignOut?: () => void;
  currentView?: 'dashboard' | 'tools';
  onViewChange?: (view: 'dashboard' | 'tools') => void;
}

const Navbar = ({ user, onSignOut, currentView = 'dashboard', onViewChange }: NavbarProps) => {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FlexSign</span>
          </div>
          
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <Button 
                  variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                  onClick={() => onViewChange?.('dashboard')}
                >
                  Dashboard
                </Button>
                <Button 
                  variant={currentView === 'tools' ? 'default' : 'ghost'}
                  onClick={() => onViewChange?.('tools')}
                >
                  PDF Tools
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">{user.email}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onSignOut}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost">Sign In</Button>
              <Button>Get Started</Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
