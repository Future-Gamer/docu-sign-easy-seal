
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Scissors, 
  Merge, 
  Compress, 
  FileImage, 
  Edit3, 
  RotateCw, 
  FileDown,
  Shuffle,
  Lock
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
      icon: <Compress className="h-8 w-8 text-yellow-600" />,
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
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">PDF Tools</h2>
        <p className="text-lg text-gray-600">
          Professional PDF tools to handle all your document needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Card key={tool.id} className={`cursor-pointer transition-all duration-200 ${tool.color} hover:shadow-lg`}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {tool.icon}
              </div>
              <CardTitle className="text-xl">{tool.title}</CardTitle>
              <CardDescription className="text-base">
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => onToolSelect(tool.id)}
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
