"use client";
import { Card, Form } from "react-bootstrap";

type InfosPatientProps = {
    assure: string;
    setAssure: (value: string) => void;
};

export default function InfosPatient({ assure, setAssure }: InfosPatientProps) {
    return (
        <Card className="p-2 mb-1" style={{ background: "#dad3d4ff" }}>
            <h5 className="mt-3">Type Patient</h5>
            <div className="d-flex justify-content-around mb-1">
                <Form.Check inline label="Non Assuré" type="radio" checked={assure === "non"} onChange={() => setAssure("non")} />
                <Form.Check inline label="Mutualiste" type="radio" checked={assure === "mutualiste"} onChange={() => setAssure("mutualiste")} />
                <Form.Check inline label="Préférentiel" type="radio" checked={assure === "assure"} onChange={() => setAssure("assure")} />
            </div>
        </Card>
    );
}
