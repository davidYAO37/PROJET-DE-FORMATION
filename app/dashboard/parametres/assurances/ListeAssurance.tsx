import React from "react";
import { IAssurance } from "@/models/assurance";
import { Button, Table } from "react-bootstrap";
import { Assurance } from "@/types/assurance";

type Props = {
    assurances: Assurance[];
    onEdit: (a: Assurance) => void;
};

export default function ListeAssurance({ assurances, onEdit }: Props) {
    return (
        <Table bordered hover responsive>
            <thead className="table-primary">
                <tr>
                    <th>#</th>
                    <th>Désignation</th>
                    <th>Code</th>
                    <th>Téléphone</th>
                    <th>Email</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {assurances.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="text-center">Aucune assurance trouvée.</td>
                    </tr>
                ) : (
                    assurances.map((a, i) => (
                        <tr key={a._id}>
                            <td>{i + 1}</td>
                            <td>{a.desiganationassurance}</td>
                            <td>{a.codeassurance}</td>
                            <td>{a.telephone}</td>
                            <td>{a.email}</td>
                            <td>
                                <Button size="sm" className="me-3" variant="outline-primary" title="Modifier l'assurance" onClick={() => onEdit(a)}>
                                    Modifier
                                </Button>
                                <Button size="sm" variant="outline-success" title="Voir le tarif assurance" onClick={() => onEdit(a)}>
                                    Tarif Assurance
                                </Button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </Table>
    );
}
