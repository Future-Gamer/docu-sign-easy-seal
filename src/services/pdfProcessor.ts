
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface SignaturePosition {
  x: number;
  y: number;
  signatureData: string;
  pageNumber: number;
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
          const { width, height } = page.getSize();

          // Convert signature data URL to image
          if (signature.signatureData.startsWith('data:image')) {
            try {
              // Remove data URL prefix
              const base64Data = signature.signatureData.split(',')[1];
              const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
              
              // Embed the signature image
              const signatureImage = await pdfDoc.embedPng(imageBytes);
              
              // Calculate position (convert from percentage to PDF coordinates)
              const x = (signature.x / 100) * width;
              const y = height - (signature.y / 100) * height - 50; // Adjust for signature height
              
              // Draw the signature
              page.drawImage(signatureImage, {
                x,
                y,
                width: 150,
                height: 50,
                opacity: 1,
              });
            } catch (imageError) {
              console.error('Error embedding signature image:', imageError);
              // Fallback to text if image fails
              const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
              page.drawText('Signed', {
                x: (signature.x / 100) * width,
                y: height - (signature.y / 100) * height,
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
      throw new Error('Failed to add signatures to PDF');
    }
  }

  static async mergePDFs(pdfFiles: File[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    for (const file of pdfFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    return await mergedPdf.save();
  }
}
