'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import { FaEye, FaEdit, FaTrash, FaPlus, FaFileAlt } from 'react-icons/fa';
import { DocumentPatient } from '@/types/DocumentPatient';

interface ListeDocumentProps {
  patientId: string;
  refreshKey?: number;
  onAdd: () => void;
  onEdit: (doc: DocumentPatient) => void;
  onDelete: (doc: DocumentPatient) => void;
}

const formatDate = (d?: string | Date) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
};

export default function ListeDocument({ patientId, refreshKey, onAdd, onEdit, onDelete }: ListeDocumentProps) {
  const [documents, setDocuments] = useState<DocumentPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentPatient | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/patient?patientId=${patientId}`);
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = await res.json();
      setDocuments(data?.data || []);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchDocuments();
  }, [patientId, refreshKey]);

  const handleDownload = (doc: DocumentPatient) => {
    if (!doc.document || !doc.extensionF) return;
    const byteCharacters = atob(doc.document);
    const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: getMimeType(doc.extensionF) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.libeleDocument || 'document'}.${doc.extensionF}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMimeType = (ext?: string) => {
    switch (ext?.toLowerCase()) {
      case 'pdf': return 'application/pdf';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'gif': return 'image/gif';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default: return 'application/octet-stream';
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0 fw-bold">Documents du patient</h6>
        <Button variant="success" size="sm" onClick={onAdd}>
          <FaPlus className="me-1" /> Ajouter
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4"><Spinner animation="border" /></div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : documents.length === 0 ? (
        <Alert variant="info">Aucun document enregistré.</Alert>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover size="sm">
            <thead className="table-dark">
              <tr>
                <th>Date</th>
                <th>N° Dossier</th>
                <th>Libellé</th>
                <th>Document joint</th>
                <th>Interprétation</th>
                <th>Ajouté par</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc._id}>
                  <td>{formatDate(doc.date)}</td>
                  <td>{doc.codeDossier || '—'}</td>
                  <td>{doc.libeleDocument || '—'}</td>
                  <td>
                    {doc.document ? (
                      <Button variant="link" size="sm" className="p-0" onClick={() => handleDownload(doc)}>
                        <FaFileAlt className="me-1" /> Télécharger
                      </Button>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{doc.interpretation || '—'}</td>
                  <td>{doc.ajouterPar || '—'}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button variant="outline-info" size="sm" title="Voir" onClick={() => setPreviewDoc(doc)}>
                        <FaEye />
                      </Button>
                      <Button variant="outline-primary" size="sm" title="Modifier" onClick={() => onEdit(doc)}>
                        <FaEdit />
                      </Button>
                      <Button variant="outline-danger" size="sm" title="Supprimer" onClick={() => onDelete(doc)}>
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={!!previewDoc} onHide={() => setPreviewDoc(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Aperçu du document</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {previewDoc?.document && (previewDoc.extensionF?.toLowerCase() === 'pdf' ? (
            <iframe
              src={`data:${getMimeType(previewDoc.extensionF)};base64,${previewDoc.document}`}
              width="100%"
              height="500px"
              title="Document"
            />
          ) : ['jpg', 'jpeg', 'png', 'gif'].includes(previewDoc.extensionF?.toLowerCase() || '') ? (
            <img
              src={`data:${getMimeType(previewDoc.extensionF)};base64,${previewDoc.document}`}
              alt={previewDoc.libeleDocument}
              className="img-fluid"
            />
          ) : (
            <p>Ce type de fichier ne peut pas être prévisualisé. Veuillez le télécharger.</p>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setPreviewDoc(null)}>Fermer</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
