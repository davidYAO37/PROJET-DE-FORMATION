'use client';

import { Card } from 'react-bootstrap';
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EvolutionConsultationStat } from '@/types/statistiques';

export default function EvolutionConsultations({ data }: { data: EvolutionConsultationStat[] }) {
  return (
    <Card className="stat-chart-card border-0 shadow-sm h-100">
      <Card.Body>
        <div className="chart-title">Évolution des consultations</div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="consultations" name="Consultations" stroke="#2563eb" fill="#bfdbfe" />
            <Line type="monotone" dataKey="rendezVous" name="Rendez-vous" stroke="#f97316" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
}
