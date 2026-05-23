'use client';

import { Card } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MontantActeStat } from '@/types/statistiques';

export default function MontantActes({ data }: { data: MontantActeStat[] }) {
  return (
    <Card className="stat-chart-card border-0 shadow-sm h-100">
      <Card.Body>
        <div className="chart-title">Classement des actes par montant</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="acte" angle={-35} textAnchor="end" height={80} interval={0} />
            <YAxis />
            <Tooltip formatter={(value) => `${Number(value).toLocaleString('fr-FR')} FCFA`} />
            <Legend />
            <Bar dataKey="montant" name="Montant" fill="#16a34a" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
}
