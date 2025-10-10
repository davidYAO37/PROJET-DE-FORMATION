'use client';

import React from 'react';
import { BiEdit } from 'react-icons/bi';
import { IoTrophySharp } from 'react-icons/io5';

type Patient = {
  _id: string; // identifiant MongoDB
  nom: string;
  prenoms: string;
  age: number;
  sexe: string;
  contact: string;
  Code_dossier: string;
};

type Props = {
  patients: Patient[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function PatientsList({ patients, onEdit, onDelete }: Props) {
  return (
    <div className="mt-4 table-responsive">
      <table className="table table-bordered table-hover">
        <thead className="table-primary text-center fw-medium">
          <tr>
            <th>Nom</th>
            <th>Prénoms</th>
            <th>Âge</th>
            <th>Sexe</th>
            <th>Contact</th>
            <th>Code Dossier</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center text-muted">
                Aucun patient trouvé.
              </td>
            </tr>
          ) : (
            patients.map((patient) => (
              <tr key={patient._id}>
                <td>{patient.nom}</td>
                <td>{patient.prenoms}</td>
                <td>{patient.age}</td>
                <td>{patient.sexe}</td>
                <td>{patient.contact}</td>
                <td>{patient.Code_dossier}</td>
                <td>
                  <button
                    className="btn btn-sm btn-warning me-2 mb-1"
                    onClick={() => onEdit(patient._id)}
                    title="Modifier le patient"
                  >
                    <BiEdit />
                  </button>
                  <button
                    className="btn btn-sm btn-danger me-2 mb-1"
                    onClick={() => onDelete(patient._id)}
                    title="Supprimer le patient"                  >
                    <IoTrophySharp />
                  </button>
                  <button
                    className="btn btn-sm btn-primary mb-1"
                    onClick={() => alert(`Dossier du patient: ${patient.Code_dossier}`)}
                    title="Voir dossier patient"
                  >
                    Dossier Patient
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
