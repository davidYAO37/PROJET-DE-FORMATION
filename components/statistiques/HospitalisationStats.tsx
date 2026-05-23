'use client';

import { Card } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { HospitalisationStat } from '@/types/statistiques';

export default function HospitalisationStats({ data }: { data: HospitalisationStat[] }) {
  return (
    <Card className="stat-chart-card border-0 shadow-sm h-100">
      <Card.Body>
        <div className="chart-title">Statistiques hospitalisation</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="statut" />
            <YAxis />
            <Tooltip formatter={(value, name) => name === 'montant' ? `${Number(value).toLocaleString('fr-FR')} FCFA` : value} />
            <Legend />
            <Bar dataKey="total" name="Dossiers" fill="#0f766e" radius={[8, 8, 0, 0]} />
            <Bar dataKey="montant" name="Montant" fill="#f59e0b" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
}
