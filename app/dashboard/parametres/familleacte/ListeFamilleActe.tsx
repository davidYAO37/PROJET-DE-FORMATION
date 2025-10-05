"use client";

import { Table, Button } from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";

interface Props {
    data: { _id: string; Description: string }[];
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
    onSelect: (item: any) => void;
    selectedId: string | null;
}

export default function ListeFamilleActe({ data, onEdit, onDelete, onSelect, selectedId }: Props) {
    return (
        <Table bordered hover responsive className="mt-3 text-center align-middle">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {data.length > 0 ? (
                    data.map((item) => (
                        <tr 
                            key={item._id}
                            onClick={() => onSelect(item)}
                            style={{ 
                                cursor: "pointer",
                                backgroundColor: selectedId === item._id ? "#e3f2fd" : "transparent"
                            }}
                            className={selectedId === item._id ? "table-active" : ""}
                        >
                            <td>{item.Description}</td>
                            <td>
                                <Button variant="outline-warning" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="me-2">
                                    <FaEdit />
                                </Button>
                                <Button variant="outline-danger" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(item._id); }}>
                                    <FaTrash />
                                </Button>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={2}>Aucune famille acte biologique enregistré.</td>
                    </tr>
                )}
            </tbody>
        </Table>
    );
}
