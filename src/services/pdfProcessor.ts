
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface SignaturePosition {
  x: number;
  y: number;
  signatureData: string;
  pageNumber: number;
  width?: number;
  height?: number;
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

          // Convert signature data URL to image
          if (signature.signatureData.startsWith('data:image')) {
            try {
              // Remove data URL prefix and decode base64
              const base64Data = signature.signatureData.split(',')[1];
              const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
              
              // Try to embed as PNG first, then fallback to JPEG
              let signatureImage;
              try {
                signatureImage = await pdfDoc.embedPng(imageBytes);
              } catch {
                try {
                  signatureImage = await pdfDoc.embedJpg(imageBytes);
                } catch {
                  throw new Error('Unsupported image format');
                }
              }
              
              // Calculate position and size
              const signatureWidth = signature.width || 150;
              const signatureHeight = signature.height || 50;
              
              // Convert from percentage to PDF coordinates
              const x = (signature.x / 100) * pageWidth;
              const y = pageHeight - (signature.y / 100) * pageHeight - signatureHeight;
              
              // Draw the signature
              page.drawImage(signatureImage, {
                x: Math.max(0, x),
                y: Math.max(0, y),
                width: Math.min(signatureWidth, pageWidth - x),
                height: Math.min(signatureHeight, pageHeight - y),
                opacity: 1,
              });
            } catch (imageError) {
              console.error('Error embedding signature image:', imageError);
              // Fallback to text signature
              const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
              const x = (signature.x / 100) * pageWidth;
              const y = pageHeight - (signature.y / 100) * pageHeight;
              
              page.drawText('Digitally Signed', {
                x: Math.max(0, x),
                y: Math.max(0, y),
                size: 12,
                font,
                color: rgb(0, 0, 0),
              });
            }
          }
        }
      }

      return await pdfDoc.save();
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error(`Failed to add signatures to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
