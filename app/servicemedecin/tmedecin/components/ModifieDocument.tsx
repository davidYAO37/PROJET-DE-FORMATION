'use client';

import React from 'react';
import DocumentFormModal from './DocumentFormModal';
import { DocumentPatient } from '@/types/DocumentPatient';

interface ModifieDocumentProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  document: DocumentPatient | null;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
  codeDossier?: string;
}

export default function ModifieDocument(props: ModifieDocumentProps) {
  const { document, ...rest } = props;
  return <DocumentFormModal {...rest} documentToEdit={document} />;
}
