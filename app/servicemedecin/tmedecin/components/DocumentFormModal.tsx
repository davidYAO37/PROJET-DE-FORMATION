'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import {
  FaSave,
  FaTimes,
  FaUser,
  FaFolderOpen,
  FaCalendarAlt,
  FaClock,
  FaStethoscope,
  FaHospital,
  FaCloudUploadAlt,
  FaFileAlt,
  FaNotesMedical,
} from 'react-icons/fa';
import { DocumentPatient } from '@/types/DocumentPatient';
import { useAuthUser } from '@/hooks/useAuthUser';

interface Medecin {
  _id: string;
  nom?: string;
  prenoms?: string;
  Nom?: string;
  Prenoms?: string;
}

interface ExamenHospitOption {
  _id: string;
  CodePrestation?: string;
  Designationtypeacte?: string;
  Entrele?: string | Date;
}

interface DocumentFormModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  documentToEdit?: DocumentPatient | null;
  patientId: string;
  patientNom?: string;
  patientPrenoms?: string;
  codeDossier?: string;
}

const todayInput = () => new Date().toISOString().split('T')[0];
const nowInput = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export default function DocumentFormModal({
  show,
  onHide,
  onSave,
  documentToEdit,
  patientId,
  patientNom,
  patientPrenoms,
  codeDossier,
}: DocumentFormModalProps) {
  const isEdit = !!documentToEdit;

  const { user: authUser } = useAuthUser();

  const [formData, setFormData] = useState({
    libeleDocument: '',
    typeDoc: '',
    interpretation: '',
    idprestation: '',
    nPrestation: '',
    idMedecin: '',
    medecinNom: '',
    date: todayInput(),
    heure: nowInput(),
  });
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileName, setFileName] = useState('');
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [examensHospit, setExamensHospit] = useState<ExamenHospitOption[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!show) return;
    setLoadingLists(true);
    const fetchLists = async () => {
      try {
        const entrepriseId = typeof window !== 'undefined' ? localStorage.getItem('IdEntreprise') || '' : '';
        const [medRes, examRes] = await Promise.allSettled([
          fetch(`/api/medecins${entrepriseId ? `?entrepriseId=${encodeURIComponent(entrepriseId)}` : ''}`),
          fetch(`/api/examenhospitalisation/patient?patientId=${patientId}${entrepriseId ? `&entrepriseId=${encodeURIComponent(entrepriseId)}` : ''}`),
        ]);
        if (medRes.status === 'fulfilled' && medRes.value.ok) {
          const medData = await medRes.value.json();
          setMedecins(Array.isArray(medData) ? medData : medData.data || []);
        }
        if (examRes.status === 'fulfilled' && examRes.value.ok) {
          const examData = await examRes.value.json();
          setExamensHospit(examData?.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingLists(false);
      }
    };
    fetchLists();
  }, [show, patientId]);

  useEffect(() => {
    if (documentToEdit) {
      setFormData({
        libeleDocument: documentToEdit.libeleDocument || '',
        typeDoc: documentToEdit.typeDoc || '',
        interpretation: documentToEdit.interpretation || '',
        idprestation: documentToEdit.idprestation || '',
        nPrestation: documentToEdit.nPrestation || '',
        idMedecin: documentToEdit.idMedecin || '',
        medecinNom: documentToEdit.medecinNom || '',
        date: documentToEdit.date ? new Date(documentToEdit.date).toISOString().split('T')[0] : todayInput(),
        heure: documentToEdit.heure || nowInput(),
      });
      setFileBase64(documentToEdit.document || '');
      setFileName(documentToEdit.document ? 'document-existant' : '');
    } else {
      setFormData({
        libeleDocument: '',
        typeDoc: '',
        interpretation: '',
        idprestation: '',
        nPrestation: '',
        idMedecin: '',
        medecinNom: '',
        date: todayInput(),
        heure: nowInput(),
      });
      setFileBase64('');
      setFileName('');
    }
    setError(null);
  }, [documentToEdit, show]);

  // Pré-sélectionner le médecin connecté en mode création
  useEffect(() => {
    if (!show || isEdit || formData.idMedecin || !authUser || medecins.length === 0) return;

    const connectedMed = medecins.find((m) => {
      const userId = (m as any).userId?.toString?.() || (m as any).userId;
      if (userId && authUser._id && userId === authUser._id.toString()) return true;
      const medNom = `${m.nom || m.Nom || ''}`.trim().toLowerCase();
      const medPrenom = `${m.prenoms || m.Prenoms || ''}`.trim().toLowerCase();
      const authNom = `${authUser.nom || ''}`.trim().toLowerCase();
      const authPrenom = `${authUser.prenom || ''}`.trim().toLowerCase();
      return medNom === authNom && medPrenom === authPrenom;
    });

    if (connectedMed) {
      const nom = `${connectedMed.nom || connectedMed.Nom || ''} ${connectedMed.prenoms || connectedMed.Prenoms || ''}`.trim();
      setFormData((prev) => ({
        ...prev,
        idMedecin: connectedMed._id,
        medecinNom: nom,
      }));
    }
  }, [show, isEdit, authUser, medecins]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lastDot = file.name.lastIndexOf('.');
    const libelle = lastDot > 0 ? file.name.slice(0, lastDot) : file.name;
    const extension = lastDot > 0 ? file.name.slice(lastDot + 1).toLowerCase() : '';

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setFileBase64(base64);
      setFileName(file.name);
      setFormData((prev) => ({
        ...prev,
        libeleDocument: libelle,
        typeDoc: extension,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleMedecinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const med = medecins.find((m) => m._id === id);
    const nom = med ? `${med.nom || med.Nom || ''} ${med.prenoms || med.Prenoms || ''}`.trim() : '';
    setFormData((prev) => ({ ...prev, idMedecin: id, medecinNom: nom }));
  };

  const handleExamenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const exam = examensHospit.find((h) => h._id === id);
    setFormData((prev) => ({
      ...prev,
      idprestation: id,
      nPrestation: exam?.CodePrestation || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.libeleDocument.trim()) {
      setError('Merci de saisir le Libellé du document SVP');
      return;
    }
    if (!formData.idMedecin) {
      setError('Merci de sélectionner le médecin SVP');
      return;
    }

    const ext = (fileName.split('.').pop() || formData.typeDoc || '').toLowerCase();

    const payload = {
      ...formData,
      patientId,
      patientP: `${patientNom || ''} ${patientPrenoms || ''}`.trim(),
      codeDossier: codeDossier || '',
      ajouterPar: authUser
        ? `${authUser.prenom || ''} ${authUser.nom || ''}`.trim() || authUser.email || 'Utilisateur'
        : 'Utilisateur',
      entrepriseId: authUser?.entrepriseId || (typeof window !== 'undefined' ? localStorage.getItem('IdEntreprise') || '' : ''),
      document: fileBase64,
      extensionF: ext,
    };

    setSaving(true);
    try {
      const url = isEdit ? `/api/documents/patient/${documentToEdit!._id}` : '/api/documents/patient';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors de l\'enregistrement');
      }
      onSave();
      onHide();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const sectionStyle = {
    background: '#ffffff',
    border: '1px solid #e9ecef',
    borderRadius: '12px',
    padding: '1.25rem',
    marginBottom: '1rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  };

  const sectionTitleStyle = {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#0d6efd',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    borderBottom: '1px solid #e9ecef',
    paddingBottom: '0.5rem',
  };

  const labelStyle = {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: '#495057',
    marginBottom: '0.35rem',
  };

  const readonlyStyle = {
    backgroundColor: '#f8f9fa',
    fontWeight: 500,
  };

  const fileBadgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#e7f3ff',
    color: '#0d6efd',
    padding: '0.4rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    marginTop: '0.5rem',
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable backdrop="static">
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="d-flex align-items-center gap-2 text-primary">
          <FaFileAlt size={22} />
          {isEdit ? 'Modifier le document' : "Enregistrer un document patient"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-white">
        {error && <div className="alert alert-danger py-2 d-flex align-items-center gap-2">{error}</div>}
        <Form onSubmit={handleSubmit}>
          {/* Informations patient */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>
              <FaUser /> Informations patient
            </div>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={labelStyle}>N° Dossier</Form.Label>
                  <Form.Control type="text" value={codeDossier || ''} readOnly style={readonlyStyle} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={labelStyle}>Patient</Form.Label>
                  <Form.Control
                    type="text"
                    value={`${patientNom || ''} ${patientPrenoms || ''}`.trim()}
                    readOnly
                    style={readonlyStyle}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={labelStyle}><FaCalendarAlt className="me-1" /> Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={labelStyle}><FaClock className="me-1" /> Heure</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.heure}
                    onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Prestation associée */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>
              <FaHospital /> Prestation associée
            </div>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={labelStyle}>N° Reçu Acte</Form.Label>
                  <Form.Select value={formData.idprestation} onChange={handleExamenChange}>
                    <option value="">Sélectionner une hospitalisation...</option>
                    {examensHospit.map((exam) => (
                      <option key={exam._id} value={exam._id}>
                        {exam.CodePrestation || exam._id} — {exam.Designationtypeacte || 'Hospit.'} ({exam.Entrele ? new Date(exam.Entrele).toLocaleDateString('fr-FR') : ''})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={labelStyle}>N° Prestation</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nPrestation}
                    onChange={(e) => setFormData({ ...formData, nPrestation: e.target.value })}
                    placeholder="Code prestation"
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Document */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>
              <FaFolderOpen /> Contenu du document
            </div>
            <Row className="g-3">
              <Col md={8}>
                <Form.Group>
                  <Form.Label style={labelStyle}>Libellé Document *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.libeleDocument}
                    onChange={(e) => setFormData({ ...formData, libeleDocument: e.target.value })}
                    placeholder="Ex : Compte-rendu opératoire"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label style={labelStyle}>Type de Document</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.typeDoc}
                    onChange={(e) => setFormData({ ...formData, typeDoc: e.target.value })}
                    placeholder="pdf, jpg..."
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label style={labelStyle}><FaCloudUploadAlt className="me-1" /> Fichier joint</Form.Label>
                  <Form.Control type="file" onChange={handleFileChange} />
                  {fileName && (
                    <div style={fileBadgeStyle}>
                      <FaFileAlt size={14} />
                      <span>{fileName}</span>
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Médecin & Interprétation */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>
              <FaStethoscope /> Médecin & Interprétation
            </div>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={labelStyle}>Médecin *</Form.Label>
                  <Form.Select value={formData.idMedecin} onChange={handleMedecinChange}>
                    <option value="">Sélectionner un médecin...</option>
                    {medecins.map((med) => (
                      <option key={med._id} value={med._id}>
                        {`${med.nom || med.Nom || ''} ${med.prenoms || med.Prenoms || ''}`.trim() || med._id}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label style={labelStyle}><FaNotesMedical className="me-1" /> Interprétation</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.interpretation}
                    onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
                    placeholder="Commentaires ou interprétation médicale..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          <div className="d-flex justify-content-end gap-3 pt-2">
            <Button variant="outline-secondary" onClick={onHide} disabled={saving} className="px-4">
              <FaTimes className="me-2" /> Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={saving || loadingLists} className="px-4">
              {saving ? <><Spinner size="sm" className="me-2" /> Enregistrement...</> : <><FaSave className="me-2" /> Enregistrer le document</>}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
