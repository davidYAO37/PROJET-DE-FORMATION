"use client";

import { Table, Button } from "react-bootstrap";

interface Props {
    data: { _id: string; Designation: string }[];
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
}

export default function ListeTypeActe({ data, onEdit, onDelete }: Props) {
    return (
        <Table bordered hover responsive className="mt-3 text-center align-middle">
            <thead>
                <tr>
                    <th>Désignation</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {data.length > 0 ? (
                    data.map((item) => (
                        <tr key={item._id}>
                            <td>{item.Designation}</td>
                            <td>
                                <Button variant="warning" size="sm" onClick={() => onEdit(item)}>Modifier</Button>{" "}
                                <Button variant="danger" size="sm" onClick={() => onDelete(item._id)}>Supprimer</Button>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={2}>Aucun type d’acte enregistré.</td>
                    </tr>
                )}
            </tbody>
        </Table>
    );
}
