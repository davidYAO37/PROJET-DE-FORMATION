'use client';

import { Card } from 'react-bootstrap';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { RepartitionSexeStat } from '@/types/statistiques';

const COLORS = ['#ec4899', '#3b82f6', '#94a3b8'];

export default function RepartitionHommeFemme({ data }: { data: RepartitionSexeStat[] }) {
  return (
    <Card className="stat-chart-card border-0 shadow-sm h-100">
      <Card.Body>
        <div className="chart-title">Répartition homme / femme</div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="sexe" cx="50%" cy="50%" outerRadius={105} label>
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
