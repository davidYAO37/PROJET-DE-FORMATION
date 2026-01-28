"use client";

import { Modal, Row, Col } from "react-bootstrap";
import { useEffect, useState } from "react";
import InfoPatient from "./InfoPatient";
import HistoriqueConstantes from "./HistoriqueConstantes";
import TableMedicaments from "./TableMedicaments";
import ModePaiement from "./ModePaiement";
import { PrescriptionForm } from "@/types/Prescription";

type Props = {
    show: boolean;
    onHide: () => void;
    codePrestation?: string;
};

export default function PaiementPharmacieModal({
    show,
    onHide,
    codePrestation,
}: Props) {

    const [patient, setPatient] = useState<any>(null);
    const [consultation, setConsultation] = useState<any>(null);

    /** 🔹 FORMULAIRE PAIEMENT */
    const [formData, setFormData] = useState<PrescriptionForm>({
        Montanttotal: 0,
        PartAssurance: 0,
        PartAssure: 0,
        Remise: 0,
        Restapayer: 0,
        MotifRemise: "",
    });

    const [modePaiement, setModePaiement] = useState<string>("");
    const [montantEncaisse, setMontantEncaisse] = useState<number>(0);

    const [medicaments, setMedicaments] = useState<any[]>([]);

    /* =========================
       À L’OUVERTURE DU MODAL
       ========================= */
    useEffect(() => {
        if (!show) return;

        if (codePrestation) {
            handleCodePrestation(codePrestation);
        }
    }, [show]);

    /* =========================
       CHARGEMENT PRESTATION
       ========================= */
    const handleCodePrestation = async (code: string) => {
        const resConsult = await fetch(`/api/consultation/${code}`);
        if (!resConsult.ok) {
            alert("Code non valide");
            return;
        }

        const consult = await resConsult.json();
        if (!consult.statutC) {
            alert("Consultation pas encore payée à la caisse");
            return;
        }

        setConsultation(consult);

        const pat = await fetch(`/api/patient/${consult.code_dossier}`).then(r => r.json());
        setPatient(pat);

        const pres = await fetch(`/api/prescription/${code}`).then(r => r.json());

        /** 🔹 INITIALISATION FORMULAIRE */
        const partAssure = pres.PartAssure ?? 0;
        const remise = pres.Remise ?? 0;

        setFormData({
            Montanttotal: pres.Montanttotal ?? 0,
            PartAssurance: pres.PartAssurance ?? 0,
            PartAssure: partAssure,
            Remise: remise,
            Restapayer: Math.max(partAssure - remise, 0),
            MotifRemise: pres.MotifRemise ?? "",
        });

        setModePaiement(pres.modePaiement ?? "");
        setMontantEncaisse(pres.MontantRecu ?? 0);

        const meds = await fetch(
            `/api/prescription-medicament/${pres._id}`
        ).then(r => r.json());

        setMedicaments(meds);
    };

    /* =========================
       RECALCUL RESTE À PAYER
       ========================= */
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            Restapayer: Math.max(
                (prev.PartAssure ?? 0) - (prev.Remise ?? 0) - montantEncaisse,
                0
            ),
        }));
    }, [formData.Remise, montantEncaisse]);

    return (
        <Modal show={show} onHide={onHide} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>FICHE DE PAIEMENT PHARMACIE</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Row>
                    <Col md={3}>
                        <InfoPatient
                            patient={patient}
                            consultation={consultation}
                        />

                        <HistoriqueConstantes
                            consultation={consultation}
                        />
                    </Col>

                    <Col md={9}>
                        <TableMedicaments
                            medicaments={medicaments}
                        />

                        

                        <ModePaiement
                            formData={formData}
                            setFormData={setFormData}
                            modePaiement={modePaiement}
                            setModePaiement={setModePaiement}
                            montantEncaisse={montantEncaisse}
                            setMontantEncaisse={setMontantEncaisse}
                        />
                    </Col>
                </Row>
            </Modal.Body>
        </Modal>
    );
}