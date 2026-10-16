import React, { useEffect, useState } from 'react';
import { Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { ExamenHospitalisationForm } from '@/types/examenHospitalisation';
import { IMedecin } from '@/models/medecin';
import { getMedecins } from '@/app/pages/services/medecinService';

interface CliniqueInfoProps {
    formData: ExamenHospitalisationForm;
    setFormData: React.Dispatch<React.SetStateAction<ExamenHospitalisationForm>>;
    hasActesMedecin: boolean;
    hasActesApporteur: boolean;
    apporteurActif?: boolean;
}

type Apporteur = { _id: string; nom: string; taux: number };




export default function CliniqueInfoCaisse({ formData, setFormData, hasActesMedecin, hasActesApporteur, apporteurActif = true }: CliniqueInfoProps) {
    const [medecinExecutant, setMedecinExecutant] = useState<IMedecin[]>([]);
    const [apporteurs, setApporteurs] = useState<Apporteur[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMedecinExecutant = async () => {
            try {
                const [data, apporteursData] = await Promise.all([
                    getMedecins(),
                    fetch("/api/apporteurs?actifs=true").then(res => res.json()),
                ]);
                setMedecinExecutant(data);
                setApporteurs(Array.isArray(apporteursData) ? apporteursData : []);
            } catch (error) {
                console.error('Erreur lors du chargement des médecins:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMedecinExecutant();
    }, []);

    // Réinitialiser le médecin exécutant s'il n'y a pas d'actes médicaux
    useEffect(() => {
        if (!hasActesMedecin && formData.medecinId) {
            setFormData(prev => ({
                ...prev,
                medecinId: '',
                medecinPrescripteur: ''
            }));
        }
    }, [hasActesMedecin, formData.medecinId, setFormData]);

    // Réinitialiser l'apporteur si la fonctionnalité est désactivée ou s'il n'y a pas d'actes apporteur
    useEffect(() => {
        if ((!apporteurActif || !hasActesApporteur) && formData.apporteurId) {
            setFormData(prev => ({
                ...prev,
                apporteurId: '',
                apporteurNom: ''
            }));
        }
    }, [apporteurActif, hasActesApporteur, formData.apporteurId, setFormData]);

    
    const handleMedecinExecutantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const medecinId = e.target.value;

        setFormData(prev => ({
            ...prev,
            medecinId: medecinId
        }));
    };

    
    return (
        <Card>
            <Card.Header> Clinique Info</Card.Header>
            <Card.Body className=" justify-content-between align-items-center ">
                <Row className="g-3 align-items-end mb-2">
                    <Form.Group as={Col} md={4}>
                        <Form.Label>Renseignements Cliniques</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            value={formData.Rclinique}
                            onChange={(e) => setFormData({ ...formData, Rclinique: e.target.value })}
                        />
                    </Form.Group>

                    <Form.Group as={Col} md={4}>
                        <Form.Label>Médecin Exécutant</Form.Label>
                        {loading ? (
                            <div className="text-center">
                                <Spinner animation="border" size="sm" />
                                <span className="ms-2">Chargement des médecins...</span>
                            </div>
                        ) : (
                            <Form.Select
                                value={formData.medecinId || ''}
                                onChange={handleMedecinExecutantChange}
                                required
                                disabled={!hasActesMedecin || loading}
                                title={!hasActesMedecin ? "Aucun acte médical nécessitant un médecin exécutant" : undefined}
                            >
                                <option value="">
                                    {!hasActesMedecin
                                        ? "Ajoutez d'abord un acte médical nécessitant un médecin exécutant"
                                        : "Ajouter un médecin exécutant"}
                                </option>
                                {medecinExecutant.map((medecin) => {
                                    const medecinId = medecin._id?.toString() || '';
                                    return (
                                        <option key={medecinId} value={medecinId}>
                                            {medecin.nom} {medecin.prenoms} {medecin.specialite ? `(${medecin.specialite})` : ''}
                                        </option>
                                    );
                                })}
                            </Form.Select>
                        )}
                    </Form.Group>
                    {apporteurActif && (
                    <Form.Group as={Col} md={4}>
                        <Form.Label>Apporteur</Form.Label>
                        <Form.Select value={formData.apporteurId || ""} onChange={e => setFormData(prev => ({ ...prev, apporteurId: e.target.value }))} required={hasActesApporteur} disabled={!hasActesApporteur || loading}>
                            <option value="">{hasActesApporteur ? "Sélectionner un apporteur" : "Aucun acte pour apporteur"}</option>
                            {apporteurs.map(a => <option key={a._id} value={a._id}>{a.nom} ({a.taux}%)</option>)}
                        </Form.Select>
                    </Form.Group>
                    )}
                </Row>
            </Card.Body>
        </Card>

    );
}
