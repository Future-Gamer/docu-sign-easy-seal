
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface SignaturePosition {
  x: number;
  y: number;
  signatureData: string;
  pageNumber: number;
  width?: number;
  height?: number;
  fieldType?: string;
}

export class PDFProcessor {
  static async addSignaturesToPDF(
    originalPdfBytes: ArrayBuffer,
    signatures: SignaturePosition[]
  ): Promise<Uint8Array> {
    try {
      const pdfDoc = await PDFDocument.load(originalPdfBytes);
      const pages = pdfDoc.getPages();

      for (const signature of signatures) {
        const pageIndex = signature.pageNumber - 1;
        if (pageIndex >= 0 && pageIndex < pages.length) {
          const page = pages[pageIndex];
          const { width: pageWidth, height: pageHeight } = page.getSize();

          // Calculate position and size
          const signatureWidth = signature.width || 200;
          const signatureHeight = signature.height || 80;
          
          // Position relative to PDF coordinate system (bottom-left origin)
          const x = (signature.x / 100) * pageWidth;
          const y = pageHeight - (signature.y / 100) * pageHeight - signatureHeight;

          // Handle different field types
          if (signature.signatureData && signature.signatureData.startsWith('data:image')) {
            try {
              // Handle image signatures and company stamps
              const base64Data = signature.signatureData.split(',')[1];
              const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
              
              let signatureImage;
              if (signature.signatureData.includes('image/png')) {
                signatureImage = await pdfDoc.embedPng(imageBytes);
              } else {
                signatureImage = await pdfDoc.embedJpg(imageBytes);
              }
              
              page.drawImage(signatureImage, {
                x: Math.max(0, x),
                y: Math.max(0, y),
                width: Math.min(signatureWidth, pageWidth - x),
                height: Math.min(signatureHeight, pageHeight - y),
                opacity: 1,
              });

            } catch (imageError) {
              console.error('Error embedding image:', imageError);
              // Fallback to text
              await this.drawTextField(pdfDoc, page, signature.signatureData, x, y, signature.fieldType);
            }
          } else {
            // Handle text-based fields
            await this.drawTextField(pdfDoc, page, signature.signatureData, x, y, signature.fieldType);
          }

          console.log(`Field embedded at page ${signature.pageNumber}: x=${x}, y=${y}, type=${signature.fieldType}`);
        }
      }

      const pdfBytes = await pdfDoc.save();
      console.log('PDF saved with signatures, size:', pdfBytes.length);
      return pdfBytes;
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error(`Failed to add signatures to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async drawTextField(
    pdfDoc: PDFDocument,
    page: any,
    text: string,
    x: number,
    y: number,
    fieldType?: string
  ) {
    try {
      let fontSize = 14;
      let fontStyle = StandardFonts.Helvetica;

      // Adjust font based on field type
      switch (fieldType) {
        case 'signature':
          fontSize = 18;
          fontStyle = StandardFonts.HelveticaBoldOblique;
          break;
        case 'initials':
          fontSize = 16;
          fontStyle = StandardFonts.HelveticaBold;
          break;
        case 'name':
          fontSize = 12;
          fontStyle = StandardFonts.Helvetica;
          break;
        case 'date':
          fontSize = 10;
          fontStyle = StandardFonts.Helvetica;
          break;
        case 'text':
          fontSize = 10;
          fontStyle = StandardFonts.Helvetica;
          break;
        case 'company_stamp':
          fontSize = 8;
          fontStyle = StandardFonts.HelveticaBold;
          break;
        default:
          fontSize = 14;
      }

      const finalFont = await pdfDoc.embedFont(fontStyle);
      
      // Clean text - remove any code or data URLs
      let cleanText = text;
      if (text.startsWith('data:')) {
        cleanText = '[IMAGE]';
      }
      
      page.drawText(cleanText || '[SIGNED]', {
        x: Math.max(0, x + 5), // Small padding
        y: Math.max(0, y + (fontSize / 2)), // Center vertically
        size: fontSize,
        font: finalFont,
        color: rgb(0, 0, 0),
      });
    } catch (error) {
      console.error('Error drawing text field:', error);
      // Fallback
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      page.drawText('[SIGNED]', {
        x: Math.max(0, x),
        y: Math.max(0, y),
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }

  static async splitPDF(pdfBytes: ArrayBuffer): Promise<Uint8Array[]> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const splitPDFs: Uint8Array[] = [];

      for (let i = 0; i < pages.length; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
        newPdf.addPage(copiedPage);
        
        const pdfBytesResult = await newPdf.save();
        splitPDFs.push(pdfBytesResult);
      }

      return splitPDFs;
    } catch (error) {
      console.error('Error splitting PDF:', error);
      throw new Error(`Failed to split PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async convertPDFToImages(pdfBytes: ArrayBuffer): Promise<Blob[]> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const images: Blob[] = [];

      // For demo purposes, create mock image blobs
      // In a real implementation, you'd use a library like pdf2pic or PDF.js
      for (let i = 0; i < pages.length; i++) {
        // Create a canvas and draw PDF page content
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 595; // A4 width in points
        canvas.height = 842; // A4 height in points
        
        if (ctx) {
          // Fill with white background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add some placeholder content
          ctx.fillStyle = 'black';
          ctx.font = '16px Arial';
          ctx.fillText(`Page ${i + 1} Content`, 50, 100);
          ctx.fillText('This is a converted PDF page', 50, 150);
        }

        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob || new Blob());
          }, 'image/jpeg', 0.9);
        });

        images.push(blob);
      }

      return images;
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      throw new Error(`Failed to convert PDF to images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async addWatermarkToPDF(
    pdfBytes: ArrayBuffer,
    watermarkText: string,
    options: {
      opacity?: number;
      fontSize?: number;
      rotation?: number;
      color?: { r: number; g: number; b: number };
    } = {}
  ): Promise<Uint8Array> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const {
        opacity = 0.3,
        fontSize = 50,
        rotation = -45,
        color = { r: 0.7, g: 0.7, b: 0.7 }
      } = options;

      for (const page of pages) {
        const { width, height } = page.getSize();
        
        // Calculate text dimensions
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        // Position watermark in center
        const x = (width - textWidth) / 2;
        const y = (height - textHeight) / 2;

        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(color.r, color.g, color.b),
          opacity,
          rotate: { angle: (rotation * Math.PI) / 180 },
        });
      }

      return await pdfDoc.save();
    } catch (error) {
      console.error('Error adding watermark:', error);
      throw new Error(`Failed to add watermark: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async mergePDFs(pdfFiles: File[]): Promise<Uint8Array> {
    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of pdfFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      return await mergedPdf.save();
    } catch (error) {
      console.error('Error merging PDFs:', error);
      throw new Error(`Failed to merge PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async validatePDF(file: File): Promise<boolean> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      await PDFDocument.load(arrayBuffer);
      return true;
    } catch {
      return false;
    }
  }
}
