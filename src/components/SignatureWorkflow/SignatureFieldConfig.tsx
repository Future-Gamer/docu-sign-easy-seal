
import React from 'react';

export const requiredFields = [
  {
    id: 'signature',
    type: 'signature' as const,
    label: 'Signature',
    icon: <div className="text-blue-500">✍️</div>,
    isRequired: true
  }
];

export const optionalFields = [
  {
    id: 'initials',
    type: 'initials' as const,
    label: 'Initials',
    icon: <div className="text-green-500">AC</div>,
    isRequired: false
  },
  {
    id: 'name',
    type: 'name' as const,
    label: 'Name',
    icon: <div className="text-purple-500">👤</div>,
    isRequired: false
  },
  {
    id: 'date',
    type: 'date' as const,
    label: 'Date',
    icon: <div className="text-orange-500">📅</div>,
    isRequired: false
  },
  {
    id: 'text',
    type: 'text' as const,
    label: 'Text',
    icon: <div className="text-gray-500">📝</div>,
    isRequired: false
  },
  {
    id: 'company_stamp',
    type: 'company_stamp' as const,
    label: 'Company Stamp',
    icon: <div className="text-red-500">🏢</div>,
    isRequired: false
  }
];

export const SignatureFieldConfig = {
  requiredFields,
  optionalFields
};
