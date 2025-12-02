import React, { useEffect, useState } from 'react';
import { Card, Form, Row, Spinner } from 'react-bootstrap';
import { ExamenHospitalisationForm } from '@/types/examenHospitalisation';
import { IMedecin } from '@/models/medecin';
import { getMedecins } from '@/app/pages/services/medecinService';

interface CliniqueInfoProps {
    formData: ExamenHospitalisationForm;
    setFormData: React.Dispatch<React.SetStateAction<ExamenHospitalisationForm>>;
    hasActesMedecin: boolean;
}




export default function CliniqueInfoCaisse({ formData, setFormData, hasActesMedecin }: CliniqueInfoProps) {
    const [medecinExecutant, setMedecinExecutant] = useState<IMedecin[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMedecinExecutant = async () => {
            try {
                const data = await getMedecins();
                setMedecinExecutant(data);
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
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Group className="col-6 me-4 ">
                        <Form.Label>Renseignements Cliniques</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            value={formData.renseignementclinique}
                            onChange={(e) => setFormData({ ...formData, renseignementclinique: e.target.value })}
                        />
                    </Form.Group>

                    <Form.Group className="col-6 px-3 me-4">
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
                </div>
            </Card.Body>
        </Card>

    );
}
