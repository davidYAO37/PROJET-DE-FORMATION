'use client';

import React from 'react';
import { BiEdit } from 'react-icons/bi';
import { BsEye } from 'react-icons/bs';
import { IoTrophySharp } from 'react-icons/io5';

type Patient = {
  id: number;
  nom: string;
  prenoms: string;
  age: number;
  sexe: string;
  contact: string;
  codeDossier: string;
};

type Props = {
  patients: Patient[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
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
              <tr key={patient.id}>
                <td>{patient.nom}</td>
                <td>{patient.prenoms}</td>
                <td>{patient.age}</td>
                <td>{patient.sexe}</td>
                <td>{patient.contact}</td>
                <td>{patient.codeDossier}</td>
                <td>
                  <button
                    className="btn btn-sm btn-warning me-2 mb-1"
                    onClick={() => onEdit(patient.id)}
                    title="Modifier le patient"
                  >
                    <BiEdit />
                  </button>
                  <button
                    className="btn btn-sm btn-danger me-2 mb-1"
                    onClick={() => onDelete(patient.id)}
                    title="Supprimer le patient"                  >
                    <IoTrophySharp />
                  </button>
                  <button
                    className="btn btn-sm btn-primary mb-1"
                    onClick={() => alert(`Dossier du patient: ${patient.codeDossier}`)}
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
