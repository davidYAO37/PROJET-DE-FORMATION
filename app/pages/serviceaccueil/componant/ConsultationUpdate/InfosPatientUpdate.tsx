"use client";
import { Card, Form } from "react-bootstrap";

type InfosPatientProps = {
    assure: string;
    setAssure: (value: string) => void;
};

export default function InfosPatientUpdate({ assure, setAssure }: InfosPatientProps) {
    return (
        <Card className="p-3 mb-3 shadow-sm" style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)", border: "1px solid #dee2e6" }}>
            <h5 className="mb-3 text-primary">
                <i className="bi bi-person-badge me-2"></i>
                Type de Patient
            </h5>
            <div className="d-flex justify-content-around flex-wrap gap-3">
                <Form.Check 
                    inline 
                    label="Non Assure" 
                    type="radio" 
                    name="typePatient"
                    id="radio-non-assure"
                    checked={assure === "non"} 
                    onChange={() => setAssure("non")}
                    className="fs-6"
                />
                <Form.Check 
                    inline 
                    label="Mutualiste" 
                    type="radio" 
                    name="typePatient"
                    id="radio-mutualiste"
                    checked={assure === "mutualiste"} 
                    onChange={() => setAssure("mutualiste")}
                    className="fs-6"
                />
                <Form.Check 
                    inline 
                    label="Préférentiel" 
                    type="radio" 
                    name="typePatient"
                    id="radio-preferentiel"
                    checked={assure === "preferentiel"} 
                    onChange={() => setAssure("preferentiel")}
                    className="fs-6"
                />
            </div>
        </Card>
    );
}
