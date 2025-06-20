import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Scissors, 
  Merge, 
  Archive, 
  FileImage, 
  Edit3, 
  RotateCw, 
  FileDown,
  Shuffle,
  Lock,
  PenTool,
  Droplet,
  Shield,
  Hash,
  Search,
  Layers,
  BookOpen,
  Crop,
  Badge
} from 'lucide-react';

interface PDFToolsProps {
  onToolSelect: (tool: string) => void;
}

const PDFTools = ({ onToolSelect }: PDFToolsProps) => {
  const tools = [
    {
      id: 'merge',
      title: 'Merge PDF',
      description: 'Combine multiple PDFs into one',
      icon: <Merge className="h-8 w-8 text-red-600" />,
      color: 'hover:bg-red-50'
    },
    {
      id: 'split',
      title: 'Split PDF',
      description: 'Extract pages from your PDF',
      icon: <Scissors className="h-8 w-8 text-orange-600" />,
      color: 'hover:bg-orange-50'
    },
    {
      id: 'compress',
      title: 'Compress PDF',
      description: 'Reduce your PDF file size',
      icon: <Archive className="h-8 w-8 text-yellow-600" />,
      color: 'hover:bg-yellow-50'
    },
    {
      id: 'pdf-to-jpg',
      title: 'PDF to JPG',
      description: 'Convert PDF pages to JPG images',
      icon: <FileImage className="h-8 w-8 text-green-600" />,
      color: 'hover:bg-green-50'
    },
    {
      id: 'edit',
      title: 'Edit PDF',
      description: 'Add text, images, and shapes',
      icon: <Edit3 className="h-8 w-8 text-blue-600" />,
      color: 'hover:bg-blue-50'
    },
    {
      id: 'rotate',
      title: 'Rotate PDF',
      description: 'Rotate your PDF pages',
      icon: <RotateCw className="h-8 w-8 text-purple-600" />,
      color: 'hover:bg-purple-50'
    },
    {
      id: 'word-to-pdf',
      title: 'Word to PDF',
      description: 'Convert Word documents to PDF',
      icon: <FileDown className="h-8 w-8 text-indigo-600" />,
      color: 'hover:bg-indigo-50'
    },
    {
      id: 'organize',
      title: 'Organize PDF',
      description: 'Sort and organize PDF pages',
      icon: <Shuffle className="h-8 w-8 text-pink-600" />,
      color: 'hover:bg-pink-50'
    },
    {
      id: 'unlock',
      title: 'Unlock PDF',
      description: 'Remove password from PDF',
      icon: <Lock className="h-8 w-8 text-gray-600" />,
      color: 'hover:bg-gray-50'
    },
    {
      id: 'sign-pdf',
      title: 'Sign PDF',
      description: 'Sign yourself or request electronic signatures from others',
      icon: <PenTool className="h-8 w-8 text-blue-500" />,
      color: 'hover:bg-blue-50'
    },
    {
      id: 'watermark',
      title: 'Watermark',
      description: 'Stamp an image or text over your PDF in seconds',
      icon: <Droplet className="h-8 w-8 text-purple-500" />,
      color: 'hover:bg-purple-50'
    },
    {
      id: 'html-to-pdf',
      title: 'HTML to PDF',
      description: 'Convert webpages in HTML to PDF',
      icon: <FileText className="h-8 w-8 text-yellow-500" />,
      color: 'hover:bg-yellow-50'
    },
    {
      id: 'protect-pdf',
      title: 'Protect PDF',
      description: 'Protect PDF files with a password',
      icon: <Shield className="h-8 w-8 text-blue-700" />,
      color: 'hover:bg-blue-50'
    },
    {
      id: 'pdf-to-pdfa',
      title: 'PDF to PDF/A',
      description: 'Transform your PDF to PDF/A, the ISO-standardized version',
      icon: <FileText className="h-8 w-8 text-blue-600" />,
      color: 'hover:bg-blue-50'
    },
    {
      id: 'repair-pdf',
      title: 'Repair PDF',
      description: 'Repair a damaged PDF and recover data from corrupt PDF',
      icon: <Edit3 className="h-8 w-8 text-green-500" />,
      color: 'hover:bg-green-50'
    },
    {
      id: 'page-numbers',
      title: 'Page numbers',
      description: 'Add page numbers into PDFs with ease',
      icon: <Hash className="h-8 w-8 text-purple-500" />,
      color: 'hover:bg-purple-50'
    },
    {
      id: 'scan-to-pdf',
      title: 'Scan to PDF',
      description: 'Capture document scans from your mobile device',
      icon: <Search className="h-8 w-8 text-orange-500" />,
      color: 'hover:bg-orange-50'
    },
    {
      id: 'ocr-pdf',
      title: 'OCR PDF',
      description: 'Easily convert scanned PDF into searchable documents',
      icon: <Search className="h-8 w-8 text-green-600" />,
      color: 'hover:bg-green-50'
    },
    {
      id: 'compare-pdf',
      title: 'Compare PDF',
      description: 'Show a side-by-side document comparison',
      icon: <Layers className="h-8 w-8 text-blue-500" />,
      color: 'hover:bg-blue-50'
    },
    {
      id: 'redact-pdf',
      title: 'Redact PDF',
      description: 'Redact text and graphics to permanently remove sensitive information',
      icon: <BookOpen className="h-8 w-8 text-blue-600" />,
      color: 'hover:bg-blue-50'
    },
    {
      id: 'crop-pdf',
      title: 'Crop PDF',
      description: 'Crop margins of PDF documents or select specific areas',
      icon: <Crop className="h-8 w-8 text-purple-600" />,
      color: 'hover:bg-purple-50'
    }
  ];

  const handleToolClick = (toolId: string) => {
    console.log(`Selected tool: ${toolId}`);
    onToolSelect(toolId);
    // You can add specific functionality for each tool here
    // For now, we'll just log the selection
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">PDF Tools</h2>
        <p className="text-lg text-gray-600">
          Professional PDF tools to handle all your document needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tools.map((tool) => (
          <Card 
            key={tool.id} 
            className={`cursor-pointer transition-all duration-200 ${tool.color} hover:shadow-lg border-2 hover:border-blue-200`}
            onClick={() => handleToolClick(tool.id)}
          >
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                {tool.icon}
              </div>
              <CardTitle className="text-lg font-semibold">{tool.title}</CardTitle>
              <CardDescription className="text-sm text-gray-600 min-h-[40px]">
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleToolClick(tool.id);
                }}
                className="w-full"
                variant="outline"
              >
                Select Tool
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PDFTools;
