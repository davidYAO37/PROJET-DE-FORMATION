'use client';
import { useState, useEffect, FormEvent } from 'react';
import { Modal, Card, Row, Col, Table, Button, Form, Badge, Alert } from 'react-bootstrap';
import { FaStethoscope, FaPlus, FaEdit, FaTrash, FaPrint, FaFileAlt, FaCalendarAlt } from 'react-icons/fa';
import { useEntreprise } from '@/hooks/useEntreprise';
import { generatePrintHeader, generatePrintFooter, createPrintWindow, createPrintWindowWithoutHeader } from '@/utils/printRecu';
import { COMPTE_RENDU_OPERATOIRE_TYPES, COMPTE_RENDU_OPERATOIRE_STATUTS, TypeCompteRenduOperatoire, StatutCompteRenduOperatoire, COMPTE_RENDU_OPERATOIRE_LABELS } from '@/types/compteRenduOperatoire';

interface CompteRenduOperatoire {
    _id: string;
    patientId: string;
    patientNom?: string;
    patientPrenoms?: string;
    dateOperation: Date;
    heureDebut?: string;
    heureFin?: string;
    chirurgien: string;
    assistant?: string;
    anesthesiste?: string;
    infirmier?: string;
    typeOperation: TypeCompteRenduOperatoire;
    descriptionOperation: string;
    diagnosticPreOperatoire: string;
    gestesRealises: string;
    complications?: string;
    suitesOperatoires: string;
    traitementPostOperatoire?: string;
    dureeOperation?: number;
    statut: StatutCompteRenduOperatoire;
    numeroDossier: string;
    dateCreation: Date;
    medecinId?: string;
    entrepriseId?: string;
    observations?: string;
}

interface CompteRenduOperatoireModalProps {
    show: boolean;
    onHide: () => void;
    patientId: string;
    patientNom?: string;
    patientPrenoms?: string;
    patientCodeDossier?: string;
}

export default function CompteRenduOperatoireModal({
    show,
    onHide,
    patientId,
    patientNom,
    patientPrenoms,
    patientCodeDossier
}: CompteRenduOperatoireModalProps) {
    const [comptesRendus, setComptesRendus] = useState<CompteRenduOperatoire[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCR, setEditingCR] = useState<CompteRenduOperatoire | null>(null);
    const currentUser = localStorage.getItem('nom_utilisateur') || localStorage.getItem('userName') || '';
    const { entreprise } = useEntreprise();

    const [formData, setFormData] = useState({
        dateOperation: '',
        heureDebut: '',
        heureFin: '',
        chirurgien: currentUser,
        assistant: '',
        anesthesiste: '',
        infirmier: '',
        typeOperation: 'chirurgie_generale' as TypeCompteRenduOperatoire,
        descriptionOperation: '',
        diagnosticPreOperatoire: '',
        gestesRealises: '',
        complications: '',
        suitesOperatoires: '',
        traitementPostOperatoire: '',
        statut: 'planifie' as StatutCompteRenduOperatoire,
        numeroDossier: '',
        observations: '',
        dureeOperation: 0
    });

    const canManageCR = (cr: CompteRenduOperatoire) => {
        return cr.chirurgien?.trim() === currentUser?.trim() && cr.statut !== 'termine';
    };

    // Charger les comptes rendus opératoires du patient
    useEffect(() => {
        const chargerCR = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await fetch(`/api/compterenduoperatoire?patientId=${patientId}`);
                if (response.ok) {
                    const data = await response.json();
                    setComptesRendus(data.data || []);
                } else {
                    setComptesRendus([]);
                }
            } catch (err: any) {
                setError(err.message);
                setComptesRendus([]);
            } finally {
                setLoading(false);
            }
        };

        if (show && patientId) {
            chargerCR();
        }
    }, [show, patientId]);

    // Réinitialiser le formulaire
    const resetForm = () => {
        setFormData({
            dateOperation: '',
            heureDebut: '',
            heureFin: '',
            chirurgien: currentUser,
            assistant: '',
            anesthesiste: '',
            infirmier: '',
            typeOperation: 'chirurgie_generale',
            descriptionOperation: '',
            diagnosticPreOperatoire: '',
            gestesRealises: '',
            complications: '',
            suitesOperatoires: '',
            traitementPostOperatoire: '',
            statut: 'planifie',
            numeroDossier: '',
            observations: '',
            dureeOperation: 0
        });
        setEditingCR(null);
    };

    // Ouvrir le modal d'ajout
    const handleAdd = () => {
        resetForm();
        setShowAddModal(true);
    };

    // Ouvrir le modal d'édition
    const handleEdit = (cr: CompteRenduOperatoire) => {
        setFormData({
            dateOperation: new Date(cr.dateOperation).toISOString().split('T')[0],
            heureDebut: cr.heureDebut || '',
            heureFin: cr.heureFin || '',
            chirurgien: cr.chirurgien || currentUser || '',
            assistant: cr.assistant || '',
            anesthesiste: cr.anesthesiste || '',
            infirmier: cr.infirmier || '',
            typeOperation: cr.typeOperation || 'chirurgie_generale',
            descriptionOperation: cr.descriptionOperation,
            diagnosticPreOperatoire: cr.diagnosticPreOperatoire,
            gestesRealises: cr.gestesRealises,
            complications: cr.complications || '',
            suitesOperatoires: cr.suitesOperatoires,
            traitementPostOperatoire: cr.traitementPostOperatoire || '',
            statut: cr.statut,
            numeroDossier: cr.numeroDossier,
            observations: cr.observations || '',
            dureeOperation: cr.dureeOperation || 0
        });
        setEditingCR(cr);
        setShowAddModal(true);
    };

    // Sauvegarder le compte rendu opératoire
    const handleSave = async (e: FormEvent) => {
        e.preventDefault();

        try {
            const url = editingCR
                ? `/api/compterenduoperatoire/${editingCR._id}`
                : '/api/compterenduoperatoire';

            const method = editingCR ? 'PUT' : 'POST';

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const operationDate = new Date(formData.dateOperation);
            operationDate.setHours(0, 0, 0, 0);

            if (!editingCR && operationDate < today) {
                setError('La date d\'opération ne peut pas être antérieure à aujourd\'hui');
                return;
            }

            if (editingCR) {
                const originalDate = new Date(editingCR.dateOperation);
                originalDate.setHours(0, 0, 0, 0);
                if (operationDate < today && operationDate.getTime() !== originalDate.getTime()) {
                    setError('La date d\'opération ne peut pas être antérieure à aujourd\'hui');
                    return;
                }
            }

            let numeroDossier = editingCR?.numeroDossier;
            if (!numeroDossier && patientCodeDossier) {
                const count = comptesRendus.length + 1;
                numeroDossier = `${patientCodeDossier}-CR-${count}`;
            } else if (!numeroDossier) {
                numeroDossier = `CR-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            }

            const payload = {
                ...formData,
                patientId,
                patientNom,
                patientPrenoms,
                numeroDossier,
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-name': currentUser,
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erreur lors de la sauvegarde');
            }

            setSuccess(result.message || (editingCR ? 'Compte rendu modifié avec succès' : 'Compte rendu ajouté avec succès'));
            setTimeout(() => setSuccess(''), 3000);

            // Recharger la liste
            const crResponse = await fetch(`/api/compterenduoperatoire?patientId=${patientId}`);
            if (crResponse.ok) {
                const data = await crResponse.json();
                setComptesRendus(data.data || []);
            }

            setShowAddModal(false);
            resetForm();
        } catch (err: any) {
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        }
    };

    // Supprimer un compte rendu opératoire
    const handleDelete = async (crId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte rendu opératoire ?')) {
            return;
        }

        try {
            const response = await fetch(`/api/compterenduoperatoire/${crId}`, {
                method: 'DELETE',
                headers: {
                    'x-user-name': currentUser,
                },
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erreur lors de la suppression');
            }

            setSuccess(result.message || 'Compte rendu supprimé avec succès');
            setTimeout(() => setSuccess(''), 3000);

            setComptesRendus(comptesRendus.filter(cr => cr._id !== crId));
        } catch (err: any) {
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        }
    };

    const getTypeLibelle = (type: TypeCompteRenduOperatoire) => {
        return COMPTE_RENDU_OPERATOIRE_LABELS[type] || 'Opération';
    };

    const getCRPrintContent = (cr: CompteRenduOperatoire) => {
        const typeLibelle = getTypeLibelle(cr.typeOperation);
        const doctorName = cr.chirurgien || currentUser || 'Chirurgien inconnu';
        const clinique = entreprise?.EnteteSociete || 'CLINIQUE';
        const patientFullName = `${cr.patientNom || ''} ${cr.patientPrenoms || ''}`.trim() || 'Patient non renseigné';
        const dateOperation = new Date(cr.dateOperation).toLocaleDateString('fr-FR');
        const dateCreation = new Date(cr.dateCreation).toLocaleDateString('fr-FR');
        const duree = cr.dureeOperation ? `${Math.floor(cr.dureeOperation / 60)}h${cr.dureeOperation % 60}min` : 'Non spécifiée';
        const ville = 'Abidjan';

        return `
      <div class="print-area" style="font-family: Arial, sans-serif; color: #000; padding: 20px;">
        <div style="text-align:center; margin-bottom: 20px;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 1px;">COMPTE RENDU OPÉRATOIRE</div>
          <div style="margin-top: 8px; font-size: 14px; color: #444;">${typeLibelle.toUpperCase()}</div>
        </div>

        <div style="margin-bottom: 12px; display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 250px;"><span style="font-weight:bold;">Chirurgien :</span> <span>${doctorName}</span></div>
          <div style="flex: 1; min-width: 250px;"><span style="font-weight:bold;">Clinique :</span> <span>${clinique}</span></div>
        </div>

        <div style="margin-bottom: 24px; background: #f2f2f2; padding: 14px; border-radius: 6px;">
          <div style="font-weight:bold; margin-bottom: 6px;">Patient :</div>
          <div style="padding: 10px; background: #fff; border: 1px solid #ccc; border-radius: 4px;">${patientFullName}</div>
        </div>

        <div style="margin-bottom: 16px; display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px; background: #f2f2f2; padding: 14px; border-radius: 6px;">
            <div style="font-weight:bold; margin-bottom: 6px;">Date d'opération :</div>
            <div style="padding: 10px; background: #fff; border: 1px solid #ccc; border-radius: 4px;">${dateOperation}</div>
          </div>
          <div style="flex: 1; min-width: 200px; background: #f2f2f2; padding: 14px; border-radius: 6px;">
            <div style="font-weight:bold; margin-bottom: 6px;">Durée :</div>
            <div style="padding: 10px; background: #fff; border: 1px solid #ccc; border-radius: 4px;">${duree}</div>
          </div>
        </div>

        ${cr.heureDebut && cr.heureFin ? `
        <div style="margin-bottom: 16px; display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px; background: #f2f2f2; padding: 14px; border-radius: 6px;">
            <div style="font-weight:bold; margin-bottom: 6px;">Heure début :</div>
            <div style="padding: 10px; background: #fff; border: 1px solid #ccc; border-radius: 4px;">${cr.heureDebut}</div>
          </div>
          <div style="flex: 1; min-width: 200px; background: #f2f2f2; padding: 14px; border-radius: 6px;">
            <div style="font-weight:bold; margin-bottom: 6px;">Heure fin :</div>
            <div style="padding: 10px; background: #fff; border: 1px solid #ccc; border-radius: 4px;">${cr.heureFin}</div>
          </div>
        </div>
        ` : ''}

        <div style="margin-bottom: 16px; display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
          ${cr.assistant ? `<div style="flex: 1; min-width: 180px;"><span style="font-weight:bold;">Assistant :</span> ${cr.assistant}</div>` : ''}
          ${cr.anesthesiste ? `<div style="flex: 1; min-width: 180px;"><span style="font-weight:bold;">Anesthésiste :</span> ${cr.anesthesiste}</div>` : ''}
          ${cr.infirmier ? `<div style="flex: 1; min-width: 180px;"><span style="font-weight:bold;">Infirmier :</span> ${cr.infirmier}</div>` : ''}
        </div>

        <div style="margin-bottom: 18px; background: #f2f2f2; padding: 14px; border-radius: 6px;">
          <div style="font-weight:bold; margin-bottom: 6px;">Diagnostic pré-opératoire :</div>
          <div style="padding: 10px; background: #fff; border: 1px solid #ccc; border-radius: 4px; white-space: pre-wrap;">${cr.diagnosticPreOperatoire}</div>
        </div>

        <div style="margin-bottom: 18px; background: #f2f2f2; padding: 14px; border-radius: 6px;">
          <div style="font-weight:bold; margin-bottom: 6px;">Description de l'opération :</div>
          <div style="padding: 10px; background: #fff; border: 1px solid #ccc; border-radius: 4px; white-space: pre-wrap;">${cr.descriptionOperation}</div>
        </div>

        <div style="margin-bottom: 18px; background: #f2f2f2; padding: 14px; border-radius: 6px;">
          <div style="font-weight:bold; margin-bottom: 6px;">Gestes réalisés :</div>
          <div style="padding: 10px; background: #fff; border: 1px solid #ccc; border-radius: 4px; white-space: pre-wrap;">${cr.gestesRealises}</div>
        </div>

        ${cr.complications ? `
        <div style="margin-bottom: 18px; background: #ffe6e6; padding: 14px; border-radius: 6px;">
          <div style="font-weight:bold; margin-bottom: 6px;">Complications :</div>
          <div style="padding: 10px; background: #fff; border: 1px solid #ccc; border-radius: 4px; white-space: pre-wrap;">${cr.complications}</div>
        </div>
        ` : ''}

        <div style="margin-bottom: 18px; background: #f2f2f2; padding: 14px; border-radius: 6px;">
          <div style="font-weight:bold; margin-bottom: 6px;">Suites opératoires :</div>
          <div style="padding: 10px; background: #fff; border: 1px solid #ccc; border-radius: 4px; white-space: pre-wrap;">${cr.suitesOperatoires}</div>
        </div>

        ${cr.traitementPostOperatoire ? `
        <div style="margin-bottom: 18px; background: #e8f4ff; padding: 14px; border-radius: 6px;">
          <div style="font-weight:bold; margin-bottom: 6px;">Traitement post-opératoire :</div>
          <div style="padding: 10px; background: #fff; border: 1px solid #ccc; border-radius: 4px; white-space: pre-wrap;">${cr.traitementPostOperatoire}</div>
        </div>
        ` : ''}

        ${cr.observations ? `
        <div style="margin-bottom: 18px; background: #f9f9f9; padding: 14px; border-radius: 6px;">
          <div style="font-weight:bold; margin-bottom: 6px;">Observations :</div>
          <div style="padding: 10px; background: #fff; border: 1px solid #ccc; border-radius: 4px; white-space: pre-wrap;">${cr.observations}</div>
        </div>
        ` : ''}

        <div style="margin-bottom: 20px; font-size: 15px; line-height: 1.6;">En foi de quoi, je délivre cette présente attestation pour servir et valoir ce que de droit.</div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 40px; flex-wrap: wrap; gap: 10px;">
          <div style="font-size: 13px; color: #555;">Fait à ${ville}, le ${dateCreation}</div>
          <div style="text-align: center; font-size: 14px; font-weight: bold;">Signature du chirurgien</div>
        </div>
      </div>
    `;
    };

    const handlePrintWithHeader = (cr: CompteRenduOperatoire) => {
        const headerHTML = generatePrintHeader(entreprise);
        const footerHTML = generatePrintFooter(entreprise);
        const contentHTML = getCRPrintContent(cr);
        createPrintWindow('Compte rendu opératoire', headerHTML, contentHTML, footerHTML);
    };

    const handlePrintWithoutHeader = (cr: CompteRenduOperatoire) => {
        const contentHTML = getCRPrintContent(cr);
        createPrintWindowWithoutHeader('Compte rendu opératoire', contentHTML);
    };

    // Obtenir la couleur du badge selon le statut
    const getStatutBadge = (statut: string) => {
        switch (statut) {
            case 'planifie': return 'secondary';
            case 'en_cours': return 'warning';
            case 'termine': return 'success';
            case 'annule': return 'danger';
            default: return 'secondary';
        }
    };

    // Obtenir le libellé du statut
    const getStatutLibelle = (statut: string) => {
        switch (statut) {
            case 'planifie': return 'Planifié';
            case 'en_cours': return 'En cours';
            case 'termine': return 'Terminé';
            case 'annule': return 'Annulé';
            default: return statut;
        }
    };

    return (
        <>
            <Modal show={show} onHide={onHide} size="xl">
                <Modal.Header closeButton className="bg-info text-dark">
                    <Modal.Title className="d-flex align-items-center">
                        <FaStethoscope className="me-2" />
                        Gestion des Comptes Rendus Opératoires
                        <Badge bg="info" className="ms-2">{comptesRendus.length}</Badge>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="mb-0">
                            Patient: {patientNom} {patientPrenoms}
                        </h5>
                        <Button variant="primary" onClick={handleAdd}>
                            <FaPlus className="me-2" />
                            Nouveau CR Opératoire
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Chargement...</span>
                            </div>
                        </div>
                    ) : comptesRendus.length > 0 ? (
                        <Table striped hover responsive>
                            <thead>
                                <tr>
                                    <th>N° Dossier</th>
                                    <th>Date Opération</th>
                                    <th>Type</th>
                                    <th>Chirurgien</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comptesRendus.map((cr) => (
                                    <tr key={cr._id}>
                                        <td className="fw-bold">{cr.numeroDossier}</td>
                                        <td>{new Date(cr.dateOperation).toLocaleDateString('fr-FR')}</td>
                                        <td>{getTypeLibelle(cr.typeOperation)}</td>
                                        <td>{cr.chirurgien}</td>
                                        <td>
                                            <Badge bg={getStatutBadge(cr.statut)}>
                                                {getStatutLibelle(cr.statut)}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="btn-group" role="group">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => handleEdit(cr)}
                                                    title="Modifier"
                                                    disabled={!canManageCR(cr)}
                                                >
                                                    <FaEdit />
                                                </Button>
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() => handlePrintWithHeader(cr)}
                                                    title="Imprimer avec entête"
                                                >
                                                    <FaPrint />
                                                </Button>
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    onClick={() => handlePrintWithoutHeader(cr)}
                                                    title="Imprimer sans entête"
                                                >
                                                    <FaFileAlt />
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(cr._id)}
                                                    title="Supprimer"
                                                    disabled={!canManageCR(cr)}
                                                >
                                                    <FaTrash />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <div className="text-center py-5">
                            <FaStethoscope className="text-muted fs-1 mb-3" />
                            <p className="text-muted">Aucun compte rendu opératoire trouvé</p>
                            <Button variant="primary" onClick={handleAdd}>
                                <FaPlus className="me-2" />
                                Créer le premier compte rendu opératoire
                            </Button>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
                        Fermer
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Ajout/Modification */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingCR ? 'Modifier le Compte Rendu Opératoire' : 'Nouveau Compte Rendu Opératoire'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSave}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date d'opération *</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={formData.dateOperation}
                                        onChange={(e) => setFormData({ ...formData, dateOperation: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Heure début</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={formData.heureDebut}
                                        onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Heure fin</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={formData.heureFin}
                                        onChange={(e) => setFormData({ ...formData, heureFin: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Chirurgien *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.chirurgien}
                                        onChange={(e) => setFormData({ ...formData, chirurgien: e.target.value })}
                                        placeholder="Nom du chirurgien..."
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Type d'opération *</Form.Label>
                                    <Form.Select
                                        value={formData.typeOperation}
                                        onChange={(e) => setFormData({ ...formData, typeOperation: e.target.value as TypeCompteRenduOperatoire })}
                                        required
                                    >
                                        {COMPTE_RENDU_OPERATOIRE_TYPES.map(type => (
                                            <option key={type} value={type}>{COMPTE_RENDU_OPERATOIRE_LABELS[type]}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Assistant</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.assistant}
                                        onChange={(e) => setFormData({ ...formData, assistant: e.target.value })}
                                        placeholder="Assistant chirurgical..."
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Anesthésiste</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.anesthesiste}
                                        onChange={(e) => setFormData({ ...formData, anesthesiste: e.target.value })}
                                        placeholder="Anesthésiste..."
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Infirmier</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.infirmier}
                                        onChange={(e) => setFormData({ ...formData, infirmier: e.target.value })}
                                        placeholder="Infirmier..."
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Diagnostic pré-opératoire *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={formData.diagnosticPreOperatoire}
                                onChange={(e) => setFormData({ ...formData, diagnosticPreOperatoire: e.target.value })}
                                placeholder="Diagnostic avant l'opération..."
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description de l'opération *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.descriptionOperation}
                                onChange={(e) => setFormData({ ...formData, descriptionOperation: e.target.value })}
                                placeholder="Description détaillée de l'opération..."
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Gestes réalisés *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.gestesRealises}
                                onChange={(e) => setFormData({ ...formData, gestesRealises: e.target.value })}
                                placeholder="Gestes chirurgicaux effectués..."
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Complications</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={formData.complications}
                                onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
                                placeholder="Complications survenues (si applicable)..."
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Suites opératoires *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={formData.suitesOperatoires}
                                onChange={(e) => setFormData({ ...formData, suitesOperatoires: e.target.value })}
                                placeholder="Suites et évolution post-opératoire..."
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Traitement post-opératoire</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={formData.traitementPostOperatoire}
                                onChange={(e) => setFormData({ ...formData, traitementPostOperatoire: e.target.value })}
                                placeholder="Traitement prescrit après l'opération..."
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Statut</Form.Label>
                            <Form.Select
                                value={formData.statut}
                                onChange={(e) => setFormData({ ...formData, statut: e.target.value as StatutCompteRenduOperatoire })}
                            >
                                <option value="planifie">Planifié</option>
                                <option value="en_cours">En cours</option>
                                <option value="termine">Terminé</option>
                                <option value="annule">Annulé</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Observations</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={formData.observations}
                                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                                placeholder="Observations supplémentaires..."
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" className="me-2" onClick={() => setShowAddModal(false)}>
                                Annuler
                            </Button>
                            <Button variant="primary" type="submit">
                                {editingCR ? 'Modifier' : 'Créer'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
}