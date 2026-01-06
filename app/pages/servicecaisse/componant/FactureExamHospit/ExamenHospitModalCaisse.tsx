import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import HospitalisationPageCaisse from "./page";

interface ExamenHospitalisationModalProps {
    show: boolean;
    onHide: () => void;
    CodePrestation?: string;
    Designationtypeacte?: string;
    PatientP?: string;
    examenHospitId?: string;
    dateEntree?: string | null;
    dateSortie?: string | null;
    nombreDeJours?: number;
    renseignementclinique?: string;
}

export default function ExamenHospitalisationModalCaisse({
    show,
    onHide,
    CodePrestation = "",
    Designationtypeacte = "",
    PatientP = "",
    examenHospitId = "",
    dateEntree = null,
    dateSortie = null,
    nombreDeJours = 1,
    renseignementclinique = ""
}: ExamenHospitalisationModalProps) {

    const [key, setKey] = useState(0);

    useEffect(() => {
        if (show) {
            setKey(prevKey => prevKey + 1);
        }
    }, [show, CodePrestation, Designationtypeacte, examenHospitId]);

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="xl"
            centered
            scrollable
            dialogClassName="modal-xxl"
            style={{ maxWidth: '95vw', width: '95vw', margin: 'auto' }}
        >
            <Modal.Header
                closeButton
                className="bg-primary text-white"
                style={{ padding: '1rem' }}
            >
                <Modal.Title>
                    {CodePrestation
                        ? `FACTURATION - ${Designationtypeacte || 'Prestation'}`
                        : 'Nouvelle facture'}
                    {examenHospitId && (
                        <span className="ms-2 small fst-italic text-light">
                            (CODE PRESTATION: {CodePrestation})
                        </span>
                    )}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <HospitalisationPageCaisse
                    key={`${key}-${CodePrestation}`}
                    params={{
                        id: examenHospitId || "",
                        CodePrestation,
                        Designationtypeacte,
                        PatientP,
                        examenHospitId,
                        dateEntree: dateEntree || undefined,
                        dateSortie: dateSortie || undefined,
                        nombreDeJours,
                        renseignementclinique
                    }}
                    searchParams={{}}
                />
            </Modal.Body>
        </Modal>
    );
}

/* 
import { useEffect, useState, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import HospitalisationPageCaisse from './page';

interface ExamenHospitalisationModalProps {
    show: boolean;
    onHide: () => void;
    CodePrestation?: string;
    Designationtypeacte?: string;
    PatientP?: string;
    examenHospitId?: string;
    dateEntree?: string | null;
    dateSortie?: string | null;
    nombreDeJours?: number;
    renseignementclinique?: string;
}

interface ExamenHospitalisationForm {
    CodePrestation: string;
    Designationtypeacte: string;
    PatientP: string;
    dateEntree: string;
    dateSortie: string;
    nombreDeJours: number;
    renseignementclinique: string;
    // Ajoutez d'autres champs selon votre modèle de données
}

export default function ExamenHospitalisationModalCaisse({
    show,
    onHide,
    CodePrestation = "",
    Designationtypeacte = "",
    PatientP = "",
    examenHospitId = "",
    dateEntree = null,
    dateSortie = null,
    nombreDeJours = 1,
    renseignementclinique = ""
}: ExamenHospitalisationModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<ExamenHospitalisationForm | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const loadExamenData = useCallback(async () => {
        if (!show || !CodePrestation) return;

        setIsLoading(true);
        setError(null);

        try {
            let examenData = null;
            
            // 1. Essayer de charger par ID si disponible
            if (examenHospitId) {
                const res = await fetch(`/api/examenhospitalisationFacture/${examenHospitId}`);
                if (res.ok) {
                    examenData = await res.json();
                }
            }
            
            // 2. Si pas trouvé, essayer par CodePrestation et Designationtypeacte
            if (!examenData && CodePrestation && Designationtypeacte) {
                const params = new URLSearchParams({
                    CodePrestation,
                    typeActe: Designationtypeacte
                });
                
                const res = await fetch(`/api/examenhospitalisationFacture?${params}`);
                if (res.ok) {
                    examenData = await res.json();
                }
            }

            if (examenData) {
                setFormData(examenData);
                setIsEditMode(true);
                console.log('Mode édition - Données chargées:', examenData);
            } else {
                // Mode création avec valeurs par défaut
                setFormData({                 
                    CodePrestation,
                    Designationtypeacte,
                    PatientP,
                    dateEntree: dateEntree || new Date().toISOString().split('T')[0],
                    dateSortie: dateSortie || new Date().toISOString().split('T')[0],
                    nombreDeJours,
                    renseignementclinique,
                    // ... autres champs par défaut
                });
                setIsEditMode(false);
                console.log('Mode création - Formulaire initialisé');
            }
        } catch (err) {
            console.error("Erreur lors du chargement des données:", err);
            setError("Erreur lors du chargement des données de l'examen");
        } finally {
            setIsLoading(false);
        }
    }, [show, CodePrestation, Designationtypeacte, examenHospitId, PatientP, dateEntree, dateSortie, nombreDeJours, renseignementclinique]);

    // Charger les données quand le modal s'ouvre ou que les dépendances changent
    useEffect(() => {
        if (show) {
            loadExamenData();
        } else {
            // Réinitialiser l'état quand le modal est fermé
            setFormData(null);
            setIsEditMode(false);
            setError(null);
        }
    }, [show, loadExamenData]);

    // Gestion de la fermeture du modal
    const handleClose = () => {
        onHide();
    };

    if (!show) return null;

    return (
        <Modal
            show={show}
            onHide={handleClose}
            size="xl"
            centered
            scrollable
            dialogClassName="modal-xxl"
            style={{ maxWidth: '95vw', width: '95vw', margin: 'auto' }}
        >
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>
                    {isEditMode ? 'Modifier' : 'Nouvel'} examen d'hospitalisation
                    {CodePrestation && (
                        <span className="ms-2 small fst-italic text-light">
                            (Code: {CodePrestation})
                        </span>
                    )}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {isLoading ? (
                    <div className="text-center p-5">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Chargement...</span>
                        </div>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                ) : formData ? (
                    <HospitalisationPageCaisse
                        params={{
                            id: examenHospitId || "",
                            CodePrestation: formData.CodePrestation,
                            Designationtypeacte: formData.Designationtypeacte,
                            PatientP: formData.PatientP,
                            examenHospitId: examenHospitId,
                            dateEntree: formData.dateEntree,
                            dateSortie: formData.dateSortie,
                            nombreDeJours: formData.nombreDeJours,
                            renseignementclinique: formData.renseignementclinique
                        }}
                        searchParams={{}}
                    />
                ) : null}
            </Modal.Body>
        </Modal>
    );
} */