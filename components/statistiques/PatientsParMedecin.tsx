'use client';

import { Card } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PatientMedecinStat } from '@/types/statistiques';

export default function PatientsParMedecin({ data }: { data: PatientMedecinStat[] }) {
  return (
    <Card className="stat-chart-card border-0 shadow-sm h-100">
      <Card.Body>
        <div className="chart-title">Nombre de patients par médecin</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="medecin" angle={-35} textAnchor="end" height={80} interval={0} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="patients" name="Patients" fill="#7c3aed" radius={[8, 8, 0, 0]} />
            <Bar dataKey="consultations" name="Consultations" fill="#06b6d4" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
}
