'use client';
import React, { useEffect, useState } from 'react';
import StatCard from './StatCard';
import { FaBookMedical, FaUserClock, FaCalendarCheck } from 'react-icons/fa';
import { Patient } from '@/types/patient';
import axios from 'axios';

export default function TopBarMedecin() {
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
    <div className="d-flex justify-content-around bg-light py-3">
      <StatCard title="Patients consultés du jour" value={patients.length} icon={<FaBookMedical />} color="fuchsia" />
      <StatCard title="Consultation en attente" value={999} icon={<FaUserClock />} color="green" />
      <StatCard title="Rendez-vous du jour" value={0} icon={<FaCalendarCheck />} color="blue" />
    </div>
  );
}
