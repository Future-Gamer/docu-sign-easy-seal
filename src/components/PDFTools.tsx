
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Scissors, 
  Download, 
  Merge, 
  FileImage, 
  Shield,
  RotateCw,
  Hash,
  Scan,
  FileSearch,
  ArrowLeft
} from 'lucide-react';

// Import all tool components
import SignPDF from './tools/SignPDF';
import SplitPDF from './tools/SplitPDF';
import CompressPDF from './tools/CompressPDF';
import MergePDF from './tools/MergePDF';
import PDFToJPG from './tools/PDFToJPG';
import WatermarkPDF from './tools/WatermarkPDF';
import WordToPDF from './tools/WordToPDF';
import RotatePDF from './tools/RotatePDF';
import ProtectPDF from './tools/ProtectPDF';
import PageNumbers from './tools/PageNumbers';
import ScanToPDF from './tools/ScanToPDF';

interface PDFToolsProps {
  onBack: () => void;
}

type ToolType = 
  | 'sign' 
  | 'split' 
  | 'compress' 
  | 'merge' 
  | 'pdf-to-jpg' 
  | 'watermark' 
  | 'word-to-pdf'
  | 'rotate'
  | 'protect'
  | 'page-numbers'
  | 'scan-to-pdf'
  | 'ocr'
  | 'compare'
  | null;

const PDFTools = ({ onBack }: PDFToolsProps) => {
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);

  const tools = [
    {
      id: 'sign' as const,
      title: 'Sign PDF',
      description: 'Add your signature and other fields to PDF documents',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      available: true
    },
    {
      id: 'rotate' as const,
      title: 'Rotate PDF',
      description: 'Rotate PDF pages by 90°, 180°, or 270°',
      icon: RotateCw,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      available: true
    },
    {
      id: 'pdf-to-jpg' as const,
      title: 'PDF to JPG',
      description: 'Convert PDF pages to high-quality JPG images',
      icon: FileImage,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      available: true
    },
    {
      id: 'protect' as const,
      title: 'Protect PDF',
      description: 'Add password protection to your PDF documents',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      available: true
    },
    {
      id: 'page-numbers' as const,
      title: 'Page Numbers',
      description: 'Add customizable page numbers to your PDF',
      icon: Hash,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      available: true
    },
    {
      id: 'scan-to-pdf' as const,
      title: 'Scan to PDF',
      description: 'Convert images and scanned documents to PDF',
      icon: Scan,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      available: true
    },
    {
      id: 'split' as const,
      title: 'Split PDF',
      description: 'Extract pages or split PDF into multiple documents',
      icon: Scissors,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      available: true
    },
    {
      id: 'compress' as const,
      title: 'Compress PDF',
      description: 'Reduce PDF file size while maintaining quality',
      icon: Download,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      available: true
    },
    {
      id: 'merge' as const,
      title: 'Merge PDF',
      description: 'Combine multiple PDF files into one document',
      icon: Merge,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      available: true
    },
    {
      id: 'watermark' as const,
      title: 'Watermark PDF',
      description: 'Add text or image watermarks to your PDF',
      icon: FileImage,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      available: true
    },
    {
      id: 'word-to-pdf' as const,
      title: 'Word to PDF',
      description: 'Convert Word documents to PDF format',
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      available: true
    },
    {
      id: 'ocr' as const,
      title: 'OCR PDF',
      description: 'Extract text from scanned PDFs using OCR',
      icon: FileSearch,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      available: false
    },
    {
      id: 'compare' as const,
      title: 'Compare PDF',
      description: 'Compare two PDF documents and highlight differences',
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      available: false
    }
  ];

  const handleToolSelect = (toolId: ToolType) => {
    const tool = tools.find(t => t.id === toolId);
    if (tool && !tool.available) {
      return; // Don't allow selection of unavailable tools
    }
    setSelectedTool(toolId);
  };

  const handleBackToTools = () => {
    setSelectedTool(null);
  };

  // Render specific tool component
  if (selectedTool) {
    switch (selectedTool) {
      case 'sign':
        return <SignPDF onBack={handleBackToTools} />;
      case 'rotate':
        return <RotatePDF onBack={handleBackToTools} />;
      case 'pdf-to-jpg':
        return <PDFToJPG onBack={handleBackToTools} />;
      case 'protect':
        return <ProtectPDF onBack={handleBackToTools} />;
      case 'page-numbers':
        return <PageNumbers onBack={handleBackToTools} />;
      case 'scan-to-pdf':
        return <ScanToPDF onBack={handleBackToTools} />;
      case 'split':
        return <SplitPDF onBack={handleBackToTools} />;
      case 'compress':
        return <CompressPDF onBack={handleBackToTools} />;
      case 'merge':
        return <MergePDF onBack={handleBackToTools} />;
      case 'watermark':
        return <WatermarkPDF onBack={handleBackToTools} />;
      case 'word-to-pdf':
        return <WordToPDF onBack={handleBackToTools} />;
      default:
        return null;
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white min-h-screen">
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={onBack}
          className="mb-6 border-gray-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">PDF Tools</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive PDF processing tools for all your document needs. 
            Secure, fast, and easy to use.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <Card
              key={tool.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                tool.available 
                  ? `${tool.borderColor} hover:border-opacity-100` 
                  : 'border-gray-200 opacity-60 cursor-not-allowed'
              }`}
              onClick={() => handleToolSelect(tool.id)}
            >
              <CardHeader className={`${tool.bgColor} ${tool.available ? '' : 'bg-gray-100'}`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${tool.available ? 'bg-white' : 'bg-gray-200'}`}>
                    <IconComponent className={`h-6 w-6 ${tool.available ? tool.color : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <CardTitle className={`text-lg ${tool.available ? 'text-gray-900' : 'text-gray-500'}`}>
                      {tool.title}
                      {!tool.available && (
                        <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          Coming Soon
                        </span>
                      )}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <CardDescription className={tool.available ? 'text-gray-600' : 'text-gray-400'}>
                  {tool.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">Need Help?</h2>
          <p className="text-blue-700">
            All tools support files up to 25MB and process documents securely in your browser.
            No files are uploaded to external servers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PDFTools;
