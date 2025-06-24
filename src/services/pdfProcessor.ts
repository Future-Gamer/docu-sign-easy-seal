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
          if (signature.signatureData.startsWith('data:image')) {
            try {
              // Handle image signatures
              const base64Data = signature.signatureData.split(',')[1];
              const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
              
              const signatureImage = await pdfDoc.embedPng(imageBytes);
              
              page.drawImage(signatureImage, {
                x: Math.max(0, x),
                y: Math.max(0, y),
                width: Math.min(signatureWidth, pageWidth - x),
                height: Math.min(signatureHeight, pageHeight - y),
                opacity: 1,
              });

            } catch (imageError) {
              console.error('Error embedding signature image:', imageError);
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
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      let fontSize = 14;
      let fontStyle = StandardFonts.HelveticaBold;

      // Adjust font based on field type
      switch (fieldType) {
        case 'signature':
          fontSize = 18;
          fontStyle = StandardFonts.HelveticaBoldOblique;
          break;
        case 'initials':
          fontSize = 16;
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
        default:
          fontSize = 14;
      }

      const finalFont = await pdfDoc.embedFont(fontStyle);
      
      page.drawText(text || '[SIGNED]', {
        x: Math.max(0, x),
        y: Math.max(0, y),
        size: fontSize,
        font: finalFont,
        color: rgb(0, 0, 0),
      });
    } catch (error) {
      console.error('Error drawing text field:', error);
      // Fallback
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      page.drawText(text || '[SIGNED]', {
        x: Math.max(0, x),
        y: Math.max(0, y),
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
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
