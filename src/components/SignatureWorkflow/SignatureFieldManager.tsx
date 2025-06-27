
import React from 'react';
import { SignatureDetails } from './SignatureDetailsModal';

export interface SignatureField {
  id: string;
  type: 'signature' | 'initials' | 'name' | 'date' | 'text' | 'company_stamp';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  value?: string;
  isRequired: boolean;
}

export class SignatureFieldManager {
  static getFieldWidth(fieldType: string): number {
    switch (fieldType) {
      case 'signature': return 200;
      case 'initials': return 100;
      case 'company_stamp': return 150;
      case 'date': return 120;
      case 'text': return 150;
      case 'name': return 180;
      default: return 150;
    }
  }

  static getFieldHeight(fieldType: string): number {
    switch (fieldType) {
      case 'signature':
      case 'company_stamp': 
        return 80;
      default: 
        return 50;
    }
  }

  static getFieldValue(fieldType: string, signatureDetails: SignatureDetails | null, companyStampImage: string | null): string {
    switch (fieldType) {
      case 'signature':
        return signatureDetails?.signatureData || signatureDetails?.fullName || '';
      case 'initials':
        return signatureDetails?.initials || '';
      case 'name':
        return signatureDetails?.fullName || '';
      case 'date':
        return new Date().toLocaleDateString();
      case 'text':
        return 'Custom Text';
      case 'company_stamp':
        return companyStampImage || '';
      default:
        return '';
    }
  }

  static createField(
    fieldType: string, 
    signatureDetails: SignatureDetails | null, 
    companyStampImage: string | null,
    currentPage: number = 1
  ): SignatureField {
    return {
      id: `${fieldType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: fieldType as any,
      label: fieldType.charAt(0).toUpperCase() + fieldType.slice(1),
      x: 50,
      y: 50,
      width: this.getFieldWidth(fieldType),
      height: this.getFieldHeight(fieldType),
      pageNumber: currentPage,
      value: this.getFieldValue(fieldType, signatureDetails, companyStampImage),
      isRequired: fieldType === 'signature'
    };
  }
}
