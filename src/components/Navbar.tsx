
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, User } from 'lucide-react';

interface NavbarProps {
  user?: { name: string; email: string } | null;
  onSignOut?: () => void;
}

const Navbar = ({ user, onSignOut }: NavbarProps) => {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">DocuSign Pro</span>
          </div>
          
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">{user.name}</span>
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
