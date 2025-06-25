
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, PenTool, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentViewerProps {
  documentUrl: string;
  documentName: string;
  onBack: () => void;
  onDownload: () => void;
  showSigningInterface?: boolean;
  onSignatureAdd?: (signature: string, x: number, y: number) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentUrl,
  documentName,
  onBack,
  onDownload,
  showSigningInterface = false,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (documentUrl) {
      setIsLoading(true);
      setLoadError(null);
      
      console.log('Loading document:', documentUrl);
      
      // For Supabase storage URLs, we need to ensure they're properly accessible
      let viewUrl = documentUrl;
      
      // Check if it's a Supabase storage URL and format it properly
      if (documentUrl.includes('supabase')) {
        // Ensure the URL has proper parameters for PDF viewing
        const separator = documentUrl.includes('?') ? '&' : '?';
        viewUrl = `${documentUrl}${separator}t=${Date.now()}`;
      }
      
      setPdfUrl(viewUrl);
      
      // Test if the document is accessible
      const testAccess = async () => {
        try {
          const response = await fetch(documentUrl, { 
            method: 'HEAD',
            mode: 'cors'
          });
          
          if (!response.ok) {
            throw new Error(`Document not accessible: ${response.status} ${response.statusText}`);
          }
          
          setIsLoading(false);
          console.log('Document loaded successfully');
        } catch (error) {
          console.error('Document loading error:', error);
          setLoadError(error instanceof Error ? error.message : 'Failed to load document');
          setIsLoading(false);
          
          toast({
            title: 'Document loading failed',
            description: 'Unable to load the document. It may be private or the link may have expired.',
            variant: 'destructive',
          });
        }
      };

      testAccess();
    }
  }, [documentUrl, toast]);

  const handleRetryLoad = () => {
    setIsLoading(true);
    setLoadError(null);
    // Add timestamp to bypass cache
    const separator = documentUrl.includes('?') ? '&' : '?';
    setPdfUrl(`${documentUrl}${separator}t=${Date.now()}`);
    
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = documentName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Download started',
        description: 'Your document is being downloaded',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download failed',
        description: 'Unable to download the document',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={onBack} className="border-gray-200 bg-white hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex space-x-2">
          <Button onClick={handleDownload} className="bg-blue-500 hover:bg-blue-600">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="bg-white border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-800">{documentName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-white rounded-lg overflow-hidden border border-gray-200 w-full" style={{ minHeight: '800px' }}>
              {isLoading && (
                <div className="flex items-center justify-center h-96 bg-gray-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-gray-500">Loading document...</p>
                  </div>
                </div>
              )}
              
              {loadError && (
                <div className="flex items-center justify-center h-96 bg-gray-50">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-700 mb-2">Failed to load document</p>
                    <p className="text-sm text-gray-500 mb-4">{loadError}</p>
                    <div className="space-y-2">
                      <Button onClick={handleRetryLoad} variant="outline" className="border-gray-300 hover:bg-gray-50">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                      <Button onClick={handleDownload} className="bg-blue-500 hover:bg-blue-600 w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download Instead
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {!isLoading && !loadError && pdfUrl && (
                <div className="w-full h-full">
                  <iframe
                    src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
                    className="w-full h-full min-h-[800px] border-0"
                    title="Document Preview"
                    onLoad={() => {
                      console.log('PDF iframe loaded successfully');
                    }}
                    onError={(e) => {
                      console.error('PDF iframe error:', e);
                      setLoadError('Failed to display PDF in viewer');
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentViewer;
