'use client';
import React, { useEffect, useState } from 'react';
import { Table, Button } from 'react-bootstrap';
import { FaPen } from 'react-icons/fa';
import axios from 'axios';

interface Patient {
  nom: string;
  sexe: string;
  age: number;
  naissance: string;
  contact: string;
  codeDossier: string;
}

export default function ListePatientsMedecin() {
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axios.get('/api/patients');
        setPatients(res.data);
      } catch (error) {
        console.error('Erreur lors du chargement des patients', error);
      }
    };
    fetchPatients();
  }, []);

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Nom</th>
          <th>Sexe</th>
          <th>Age</th>
          <th>Contact</th>
          <th>Code dossier</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {patients.map((p, idx) => (
          <tr key={idx}>
            <td>{p.nom}</td>
            <td>{p.sexe}</td>
            <td>{p.age}</td>
            <td>{p.contact}</td>
            <td>{p.codeDossier}</td>
            <td>
              <Button variant="warning" size="sm"><FaPen /> Dossiers Patient</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
