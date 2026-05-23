'use client';

import { Card } from 'react-bootstrap';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PrescriptionMedecinStat } from '@/types/statistiques';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

export default function PrescriptionParMedecin({ data }: { data: PrescriptionMedecinStat[] }) {
  return (
    <Card className="stat-chart-card border-0 shadow-sm h-100">
      <Card.Body>
        <div className="chart-title">Prescription biologique par médecin</div>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="medecin" cx="50%" cy="50%" outerRadius={105} label>
              {data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
}
