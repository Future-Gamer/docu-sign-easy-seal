
import { PDFProcessor } from '@/services/pdfProcessor';
import { SignatureField } from './SignatureFieldManager';

export class PDFSigningProcessor {
  static async signPDF(file: File, signatureFields: SignatureField[]): Promise<Blob> {
    console.log('Starting PDF signing process...');
    
    const fileBuffer = await file.arrayBuffer();
    const signaturePositions = signatureFields.map(field => ({
      x: field.x,
      y: field.y,
      signatureData: field.value || '',
      pageNumber: field.pageNumber,
      width: field.width,
      height: field.height,
      fieldType: field.type
    }));

    console.log('Signature positions:', signaturePositions);

    const signedPdfBytes = await PDFProcessor.addSignaturesToPDF(fileBuffer, signaturePositions);
    const signedBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
    
    console.log('PDF signed successfully');
    return signedBlob;
  }
}
