import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';

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

          if (signature.signatureData.startsWith('data:image')) {
            try {
              // Remove data URL prefix and decode base64
              const base64Data = signature.signatureData.split(',')[1];
              const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
              
              // Embed as PNG
              const signatureImage = await pdfDoc.embedPng(imageBytes);
              
              // Calculate position and size - convert from percentage to actual coordinates
              const signatureWidth = signature.width || 200;
              const signatureHeight = signature.height || 80;
              
              // Position relative to PDF coordinate system (bottom-left origin)
              const x = (signature.x / 100) * pageWidth;
              const y = pageHeight - (signature.y / 100) * pageHeight - signatureHeight;
              
              // Draw the signature image
              page.drawImage(signatureImage, {
                x: Math.max(0, x),
                y: Math.max(0, y),
                width: Math.min(signatureWidth, pageWidth - x),
                height: Math.min(signatureHeight, pageHeight - y),
                opacity: 1,
              });

              console.log(`Signature embedded at page ${signature.pageNumber}: x=${x}, y=${y}`);
            } catch (imageError) {
              console.error('Error embedding signature image:', imageError);
              // Fallback to text signature
              const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
              const x = (signature.x / 100) * pageWidth;
              const y = pageHeight - (signature.y / 100) * pageHeight;
              
              page.drawText('[DIGITALLY SIGNED]', {
                x: Math.max(0, x),
                y: Math.max(0, y),
                size: 14,
                font,
                color: rgb(0, 0, 0),
              });
            }
          }
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
