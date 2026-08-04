'use client';

import React from 'react';
import DocumentFormModal from './DocumentFormModal';

interface AjouteDocumentProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
  codeDossier?: string;
}

export default function AjouteDocument(props: AjouteDocumentProps) {
  return <DocumentFormModal {...props} documentToEdit={null} />;
}
